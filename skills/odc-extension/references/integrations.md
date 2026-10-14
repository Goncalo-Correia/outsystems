# Integrations: Private Gateway, mTLS, and SOAP

How to make an ODC external library reach external, private, mTLS-secured, or
SOAP endpoints. All three still follow the core build → package → publish →
release flow in `SKILL.md`; this file covers only the integration-specific parts.

## Contents

- [Private Gateway (private networks)](#private-gateway)
- [Consuming an mTLS REST API](#consuming-an-mtls-rest-api)
- [Consuming a SOAP web service](#consuming-a-soap-web-service)

## Private Gateway

To reach data/services **not exposed to the internet**, ODC's Private Gateway
feature connects your custom code to those endpoints. Once a private gateway is
configured to your network, address the endpoint through the hostname in the
`SECURE_GATEWAY` environment variable, combined with the configured port.

```csharp
using System;  // required for Environment.GetEnvironmentVariable

// TLS/SSL endpoint on port 8080:
string baseUrl = $"https://{Environment.GetEnvironmentVariable("SECURE_GATEWAY")}:8080/";
// use "http" instead of "https" if the endpoint is not connected over TLS/SSL
```

Do not hardcode private hostnames — always resolve via `SECURE_GATEWAY` so the
code works across stages.

## Consuming an mTLS REST API

Mutual TLS authenticates **both** server and client via certificates (common in
zero-trust architectures). Reference project: the SDK "mTLS Project" example.

### Setup

```bash
mkdir how-to-mtls && cd how-to-mtls
dotnet new classlib --language "C#" -o ConsumeMTLSExample
dotnet add package OutSystems.ExternalLibraries.SDK
dotnet add package Newtonsoft.Json
```

IDE extensions used in the docs' example: `ms-dotnettools.csharp` and
`aliasadidev.nugetpackagemanagergui`. The client code is generated with **NSwag**
(any equivalent C# client generator works — adapt accordingly).

### Generate the REST client with NSwag

Get the service's OpenAPI/Swagger file (typically
`https://api.endpoint/swagger/v1/swagger.json`). Download the three
`Class*.liquid` templates from the SDK templates repo into a `templates/` folder
(they inject `[OSStructure]` / `[OSStructureField]` onto the generated types).
Then:

```bash
nswag openapi2csclient \
  /Input:swagger.json \
  /Namespace:MtlsClient \
  /ClassName:MtlsClientExample \
  /ClientBaseClass:MtlsHttpClientBase \
  /Output:MtlsClientExample.cs \
  /UseHttpClientCreationMethod:true \
  /GenerateClientInterfaces:true \
  /InjectHttpClient:false \
  /DisposeHttpClient:true \
  /ClientClassAccessModifier:internal \
  /ClassStyle:Record \
  /DateType:System.DateTime \
  /TemplateDirectory:templates \
  /AdditionalNamespaceUsages:OutSystems.ExternalLibraries.SDK
```

(A `generate_clientcode.ps1` + `MySwaggerConfig.nswag.template` pair in the
example does the same via an NSwag config file.)

### Client base class — where mTLS actually happens

`UseHttpClientCreationMethod:true` + `InjectHttpClient:false` makes the generated
client call a `CreateHttpClientAsync` on your base class. Implement it to load the
client certificate and validate the server cert:

```csharp
internal class MtlsHttpClientBase
{
    private static bool ValidateServerCertificate(
        HttpRequestMessage request,
        X509Certificate2? certificate,
        X509Chain? chain,
        SslPolicyErrors errors)
    {
        // custom server-cert validation; return true if trusted
    }

    protected async Task<HttpClient> CreateHttpClientAsync(CancellationToken ct)
    {
        var clientCertificate = new X509Certificate2(
            "path/to/client_certificate.pfx", "certificate_password");

        return new HttpClient(new HttpClientHandler
        {
            ClientCertificateOptions = ClientCertificateOption.Manual,
            SslProtocols = SslProtocols.Tls12,
            ServerCertificateCustomValidationCallback = ValidateServerCertificate,
            ClientCertificates = { clientCertificate }
        });
    }
}
```

> **Securely storing certificates and passwords is the customer's
> responsibility** — do not commit them; source them from a secure store.

### Expose it

Define an `[OSInterface]` interface (e.g. `ImTLSClient`) whose `[OSAction]`
methods call the generated client. Recommendation from the docs: add a `baseUrl`
(`OSDataType.Text`) parameter to each method so the endpoint is configurable per
stage. Embed the icon as a resource:

```xml
<EmbeddedResource Include="Resources\mTLSAPI.jpg" />
```

Test with an NUnit project (`dotnet new nunit`), then
`dotnet publish -c Release`, zip the publish output **contents** at the ZIP root,
and upload as usual.

## Consuming a SOAP web service

Reference project: the SDK "SOAP template" (calculator sum/subtract) plus a demo
OML. Uses the WCF `dotnet-svcutil` tool to generate the SOAP proxy.

### Setup

```bash
mkdir how-to-soap && cd how-to-soap
dotnet tool install --global dotnet-svcutil        # WCF client generator
dotnet-svcutil https://<YOUR_WSDL>                 # generates ServiceReference proxy
dotnet new classlib --language "C#" -o ConsumeSOAPExample
dotnet add package OutSystems.ExternalLibraries.SDK
```

If the SOAP service is on a private network, reach it via the **Private Gateway**
(`SECURE_GATEWAY`, above).

### Structures

```csharp
using OutSystems.ExternalLibraries.SDK;

namespace ConsumeSOAPExample.Structures
{
    [OSStructure(Description = "Number A & B")]
    public struct Numbers
    {
        [OSStructureField(DataType = OSDataType.Integer, Description = "Number A.", IsMandatory = true)]
        public int NumberA;

        [OSStructureField(DataType = OSDataType.Integer, Description = "Number B.", IsMandatory = true)]
        public int NumberB;
    }
}
```

### Interface

```csharp
using System.Xml;
using System.ServiceModel;
using ServiceReference;               // generated by dotnet-svcutil
using OutSystems.ExternalLibraries.SDK;
using ConsumeSOAPExample.Structures;

namespace ConsumeSOAPExample
{
    [OSInterface(
        Description = "Consume a SOAP web service in ODC.",
        IconResourceName = "ConsumeSOAPExample.Resources.SOAP.jpg",
        Name = "SOAP")]
    public interface ICalculator
    {
        [OSAction(Description = "Sum of two numbers.", ReturnName = "sum")]
        int Sum([OSParameter(Description = "Number A & B")] Numbers numbers);

        [OSAction(Description = "Difference of two numbers.", ReturnName = "sub")]
        int Subtract([OSParameter(Description = "Number A & B")] Numbers numbers);
    }
}
```

### Implementation — configure the binding, call the generated proxy

```csharp
public class Calculator : ICalculator
{
    private static readonly string ENDPOINTADDRESS = "https://.../Calc.asmx";
    private static readonly int TIMEOUT = 1000;
    private readonly BasicHttpBinding _binding;
    private readonly EndpointAddress _address;

    public Calculator()
    {
        _binding = new BasicHttpBinding
        {
            SendTimeout = TimeSpan.FromSeconds(TIMEOUT),
            MaxBufferSize = int.MaxValue,
            MaxReceivedMessageSize = int.MaxValue,
            AllowCookies = true,
            ReaderQuotas = XmlDictionaryReaderQuotas.Max,
            Security = new BasicHttpSecurity { Mode = BasicHttpSecurityMode.Transport }
        };
        _address = new EndpointAddress(ENDPOINTADDRESS);
    }

    public int Sum(Numbers numbers) => AddAsync(numbers).Result;

    private async Task<int> AddAsync(Numbers numbers)
    {
        using var proxy = new CalculatorWebServiceSoapClient(_binding, _address);
        return await proxy.AddAsync(numbers.NumberA, numbers.NumberB);
    }

    public int Subtract(Numbers numbers) => SubtractAsync(numbers).Result;

    private async Task<int> SubtractAsync(Numbers numbers)
    {
        using var proxy = new CalculatorWebServiceSoapClient(_binding, _address);
        return await proxy.SubtractAsync(numbers.NumberA, numbers.NumberB);
    }
}
```

Note the `using` on the proxy (it's `IDisposable`) and `BasicHttpSecurityMode.Transport`
for HTTPS. Publish/zip/upload as usual.

### Consume in ODC Studio (the calculator demo)

Add the public elements (`Sum`, `Subtract`, `Numbers`) from the `SOAP` library,
build a screen with two integer inputs, bind them into the `Numbers` structure
passed to the action, and assign the output to a display variable. First call may
take a few seconds while the container warms up.
