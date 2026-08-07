# Countries

Reference dataset of the 249 ISO 3166-1 countries and territories, ready to load into an
OutSystems `Country` entity.

## Columns

| Column | Type | Notes |
| --- | --- | --- |
| `Id` | Text (GUID) | Stable unique identifier for the record. |
| `Name` | Text | English short name of the country or territory. |
| `Code` | Integer | ISO 3166-1 **numeric** code, as an integer (Afghanistan is `4`, not `004`). |
| `Alpha2Code` | Text(2) | ISO 3166-1 alpha-2 code, uppercase (`AF`). |
| `Alpha3Code` | Text(3) | ISO 3166-1 alpha-3 code, uppercase (`AFG`). |
| `CountryTypeId` | Text (GUID) | Foreign key to `CountryType` — see below. |
| `Order` | Integer | Display order, 1..249, alphabetical by `Name` (`Åland Islands` sorts last). |
| `Is_Active` | Boolean | Always `True`. |

## CountryTypeId values

| Classification | GUID | Count |
| --- | --- | --- |
| Intracommunity (EU-27 member states) | `1d51e50d-184f-4e9e-8126-d06f3ff4020d` | 27 |
| Extracommunity (everything else) | `22348aa7-b9b7-4c34-b928-c72d7893bd56` | 222 |

Intracommunity covers the 27 EU member states. Every other entry — including EFTA countries,
the United Kingdom, and EU overseas/dependent territories outside the customs union — is
extracommunity.

## Data

| Id | Name | Code | Alpha2Code | Alpha3Code | CountryTypeId | Order | Is_Active |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7a9772b8-4fc4-40d3-b0ac-11a05b4b9815 | Afghanistan | 4 | AF | AFG | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 1 | True |
| 9917697b-231a-430a-be01-ffcf55a72219 | Albania | 8 | AL | ALB | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 2 | True |
| cf3430cf-42ca-4eb6-8f05-0a31666a71d8 | Algeria | 12 | DZ | DZA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 3 | True |
| 78ad8e9c-ce6f-42d9-aa0d-e0015e4e491b | American Samoa | 16 | AS | ASM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 4 | True |
| e16ac4fa-4456-4a13-9467-ab55490773bc | Andorra | 20 | AD | AND | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 5 | True |
| 086849af-00d4-43c7-900f-7e8fb8ea94bc | Angola | 24 | AO | AGO | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 6 | True |
| f0b0622c-4f12-4d69-bb7e-c06d37f49ca1 | Anguilla | 660 | AI | AIA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 7 | True |
| 76adeaee-bc89-4a44-98ab-3d014ecf54bf | Antarctica | 10 | AQ | ATA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 8 | True |
| 2924fa1e-f51d-4656-bf4e-30ad700c5793 | Antigua and Barbuda | 28 | AG | ATG | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 9 | True |
| 6f5fdfd0-7383-45ed-aa93-5ac3af9c50f9 | Argentina | 32 | AR | ARG | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 10 | True |
| e47918b4-ebad-4519-8e1d-445b5ccb0198 | Armenia | 51 | AM | ARM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 11 | True |
| cda0837e-e136-4f55-bc16-2b5589b19150 | Aruba | 533 | AW | ABW | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 12 | True |
| de22cea6-e7bd-4c29-983e-e2f56527e800 | Australia | 36 | AU | AUS | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 13 | True |
| b10ea9c4-aa23-443d-a88e-095ed2ff1166 | Austria | 40 | AT | AUT | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 14 | True |
| 3a15f36e-2a34-40e0-876a-7c256f6434e2 | Azerbaijan | 31 | AZ | AZE | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 15 | True |
| 056f3ff1-e69b-4ac4-9596-53dd6b19b475 | Bahamas | 44 | BS | BHS | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 16 | True |
| e09e570c-3763-407e-993b-e5bdf53a61d8 | Bahrain | 48 | BH | BHR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 17 | True |
| 7a27e745-2ba4-4190-be20-2856dcf6fe58 | Bangladesh | 50 | BD | BGD | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 18 | True |
| c81b5497-ecf9-4c38-925b-9e11b0087ab5 | Barbados | 52 | BB | BRB | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 19 | True |
| 14df9220-fe9d-4cd8-9261-b730df38de62 | Belarus | 112 | BY | BLR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 20 | True |
| a798fb51-51a1-455a-ae96-413c293d0598 | Belgium | 56 | BE | BEL | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 21 | True |
| 806afc43-5eab-4c3b-92fc-841413458a42 | Belize | 84 | BZ | BLZ | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 22 | True |
| 7a7082e1-58f9-49c3-9f0f-743f91186a17 | Benin | 204 | BJ | BEN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 23 | True |
| 0a720655-a4fe-4133-a2e7-2ea0b6541394 | Bermuda | 60 | BM | BMU | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 24 | True |
| 1d73a0b4-21d5-46df-b259-4b8ca1d24073 | Bhutan | 64 | BT | BTN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 25 | True |
| 4e9259b0-7bcf-4536-bb11-24bc2a5d21b7 | Bolivia, Plurinational State of | 68 | BO | BOL | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 26 | True |
| 4a411eb9-814c-48f4-9c97-b6427564a559 | Bonaire, Sint Eustatius and Saba | 535 | BQ | BES | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 27 | True |
| 20b15432-7b82-457a-a78f-73a6c357f789 | Bosnia and Herzegovina | 70 | BA | BIH | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 28 | True |
| fc1ef983-2d53-448f-9ca1-05901538c68e | Botswana | 72 | BW | BWA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 29 | True |
| 9d284f4d-ed36-4850-88f1-9d94d5d94fba | Bouvet Island | 74 | BV | BVT | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 30 | True |
| 2429bf60-215b-4b5f-9523-81cb15b9d786 | Brazil | 76 | BR | BRA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 31 | True |
| 9da56c44-fa68-4fe5-8427-df665d45e6d6 | British Indian Ocean Territory | 86 | IO | IOT | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 32 | True |
| f5aaf461-441d-445b-8a79-3abc4dbd51bf | Brunei Darussalam | 96 | BN | BRN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 33 | True |
| bfcf8322-eb31-45dc-beec-ef420c8e81b8 | Bulgaria | 100 | BG | BGR | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 34 | True |
| 63c62fed-6431-43b4-94b9-b00291e45ea6 | Burkina Faso | 854 | BF | BFA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 35 | True |
| 1cab446d-69e8-4617-93f9-f559fd4b74b1 | Burundi | 108 | BI | BDI | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 36 | True |
| 0a576c57-b390-4398-92d5-1f44a15108ad | Cabo Verde | 132 | CV | CPV | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 37 | True |
| 3da5bfd7-158a-4768-8cc7-1ce0e5ab1077 | Cambodia | 116 | KH | KHM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 38 | True |
| 22766b64-167f-490f-b398-2e21f3724c55 | Cameroon | 120 | CM | CMR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 39 | True |
| 7d65f7ad-6bfc-4abd-b335-132071da945a | Canada | 124 | CA | CAN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 40 | True |
| 7e960aef-806c-4629-8bb0-87c538e143e4 | Cayman Islands | 136 | KY | CYM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 41 | True |
| 4ef53eaf-d5be-4dee-aa32-e10a0e961e34 | Central African Republic | 140 | CF | CAF | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 42 | True |
| 1cf4b1b4-721d-47cb-a6e8-94b2d223b398 | Chad | 148 | TD | TCD | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 43 | True |
| 55186988-9223-4424-a43a-aac70ae35452 | Chile | 152 | CL | CHL | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 44 | True |
| 7555570f-bba4-4719-8abe-d23a07f685e3 | China | 156 | CN | CHN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 45 | True |
| 18c78ca7-cfd3-4f35-a23f-29f980c77d9b | Christmas Island | 162 | CX | CXR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 46 | True |
| 49394a05-db7d-4bec-866d-634da6a63e20 | Cocos (Keeling) Islands | 166 | CC | CCK | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 47 | True |
| 56b26cc6-586d-44f3-a357-72dcce2fafb1 | Colombia | 170 | CO | COL | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 48 | True |
| aad2df79-9b42-4b8d-a521-92cdd1ac819d | Comoros | 174 | KM | COM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 49 | True |
| 7b5e4be7-a954-478b-93a0-1e5f1d6cb241 | Congo | 178 | CG | COG | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 50 | True |
| 644800b3-3ac2-4124-8a4f-6eabdb62b84c | Congo, The Democratic Republic of the | 180 | CD | COD | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 51 | True |
| 18015093-65fb-488d-be09-025bb85295cc | Cook Islands | 184 | CK | COK | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 52 | True |
| a8a625b5-e664-45da-bae2-c14bb0824dbb | Costa Rica | 188 | CR | CRI | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 53 | True |
| 854354dd-0d38-46ed-978f-de6b7e479066 | Croatia | 191 | HR | HRV | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 54 | True |
| a8040563-8141-4c79-8509-dfcbee0291f6 | Cuba | 192 | CU | CUB | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 55 | True |
| c3c19c73-990c-4349-a8fe-1210456fdbfc | Curaçao | 531 | CW | CUW | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 56 | True |
| f9146643-7e88-411b-902a-375a23bfbdc2 | Cyprus | 196 | CY | CYP | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 57 | True |
| 62e1d6a2-6b3c-4103-85fa-1dac20dadeb7 | Czechia | 203 | CZ | CZE | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 58 | True |
| 83b9a650-ff6e-45c0-8a32-d0a8c9a6ccf5 | Côte d'Ivoire | 384 | CI | CIV | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 59 | True |
| 5afb7db4-5c2d-44d5-a93a-ce3734f32ceb | Denmark | 208 | DK | DNK | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 60 | True |
| ef9c2a2f-bbb5-4327-ba79-8502d01653de | Djibouti | 262 | DJ | DJI | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 61 | True |
| 9e9805db-9ab4-4e78-934b-05151bf1f64d | Dominica | 212 | DM | DMA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 62 | True |
| 20276d6a-706a-4f66-b4c3-dc5d9f6a5c6b | Dominican Republic | 214 | DO | DOM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 63 | True |
| 1e285e8f-c596-48c9-9a48-69ff2d27a93d | Ecuador | 218 | EC | ECU | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 64 | True |
| a0705901-fad1-4a3b-877a-a94fe03738a9 | Egypt | 818 | EG | EGY | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 65 | True |
| c026d089-bf87-4438-9c55-2d30b96fb03f | El Salvador | 222 | SV | SLV | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 66 | True |
| 0fc744ec-8d55-4afe-9986-ca93276b64e0 | Equatorial Guinea | 226 | GQ | GNQ | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 67 | True |
| df5b1516-7052-4698-b3f6-a82bcd88ecda | Eritrea | 232 | ER | ERI | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 68 | True |
| 1fb2d18c-e500-49b3-8c73-df5bd4b6bf5d | Estonia | 233 | EE | EST | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 69 | True |
| c92def68-bcf9-450d-a902-49d797dbfc05 | Eswatini | 748 | SZ | SWZ | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 70 | True |
| 9256c6cf-00ad-4867-bdbe-24480e42d447 | Ethiopia | 231 | ET | ETH | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 71 | True |
| 7c12eb71-ccec-4344-9e1d-f3b43ef5ebb3 | Falkland Islands (Malvinas) | 238 | FK | FLK | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 72 | True |
| ee6ab9a3-9f15-4a6a-b1da-4b1a196e13b9 | Faroe Islands | 234 | FO | FRO | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 73 | True |
| d562533d-2403-4b80-a1b4-e2c02f2dc356 | Fiji | 242 | FJ | FJI | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 74 | True |
| 31a06e2b-1501-4202-880f-d25f1ab5be21 | Finland | 246 | FI | FIN | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 75 | True |
| 690bad37-280e-4569-91d3-de9af2b318cd | France | 250 | FR | FRA | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 76 | True |
| 420d0219-e43a-4033-af17-b413e8a00cfb | French Guiana | 254 | GF | GUF | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 77 | True |
| 8b513052-6164-49d9-806e-11c1401b6ce0 | French Polynesia | 258 | PF | PYF | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 78 | True |
| b0b97121-b71b-4a32-bb74-4d9d232b900b | French Southern Territories | 260 | TF | ATF | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 79 | True |
| 3e9c3a0b-eb9c-41e7-9187-e65d9cb9a559 | Gabon | 266 | GA | GAB | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 80 | True |
| 94298244-9360-4b0f-9433-7a166a0ae5a0 | Gambia | 270 | GM | GMB | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 81 | True |
| 28500c00-a664-49e2-8228-844e3d6e958f | Georgia | 268 | GE | GEO | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 82 | True |
| 0c6a2eec-1237-4a0b-9221-c9cb85477e12 | Germany | 276 | DE | DEU | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 83 | True |
| 25c4c3fc-bd6c-4f08-a48e-9c7c7de5b426 | Ghana | 288 | GH | GHA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 84 | True |
| a6178e37-04ca-427b-9734-3307b523e787 | Gibraltar | 292 | GI | GIB | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 85 | True |
| 65640a0e-f04b-4185-8064-39508f862759 | Greece | 300 | GR | GRC | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 86 | True |
| 4bcb9cbf-eb2f-4316-9c78-5763785abed1 | Greenland | 304 | GL | GRL | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 87 | True |
| 6f415afb-a629-4cec-ae0e-e1e5a007f1f3 | Grenada | 308 | GD | GRD | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 88 | True |
| 2bf9e8fb-dfed-4d2b-8703-75ab7d61c07e | Guadeloupe | 312 | GP | GLP | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 89 | True |
| 2f45c9b7-e359-4298-88d6-d077a5557721 | Guam | 316 | GU | GUM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 90 | True |
| 28f63a11-56b6-4f54-8ef5-b3c8d12a61d3 | Guatemala | 320 | GT | GTM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 91 | True |
| 6d2651e1-2d8e-42ea-b795-966fbca962dc | Guernsey | 831 | GG | GGY | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 92 | True |
| 4aa4d564-f40d-4f93-a34b-a744ed37ef67 | Guinea | 324 | GN | GIN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 93 | True |
| 51388c8c-be1f-4023-a833-6f9aad372683 | Guinea-Bissau | 624 | GW | GNB | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 94 | True |
| 176bb1eb-8084-4086-9977-794bdfb0f335 | Guyana | 328 | GY | GUY | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 95 | True |
| 39ea95d8-9e47-4250-82cd-2f7bcf598535 | Haiti | 332 | HT | HTI | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 96 | True |
| ef90f569-b9f9-495f-869d-8390cc5d8a4b | Heard Island and McDonald Islands | 334 | HM | HMD | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 97 | True |
| 03be76e8-87be-407e-9e46-44955b7e5041 | Holy See (Vatican City State) | 336 | VA | VAT | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 98 | True |
| d2d0d76a-f5db-4cdb-bd78-3f91ae3a17b8 | Honduras | 340 | HN | HND | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 99 | True |
| 4c5e9b9c-0781-4742-8c4d-cf945e0e6cd4 | Hong Kong | 344 | HK | HKG | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 100 | True |
| e4a8edfb-c356-4188-976c-6e87dd248b24 | Hungary | 348 | HU | HUN | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 101 | True |
| b56801d0-a167-417f-b948-1a6b78953c61 | Iceland | 352 | IS | ISL | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 102 | True |
| cd610b15-9ae6-4511-8924-3e9e8ec17246 | India | 356 | IN | IND | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 103 | True |
| 0dc9e7ea-f71c-487a-a249-e3744f6bc5bf | Indonesia | 360 | ID | IDN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 104 | True |
| e4cac9fe-0bc1-4cce-9511-521d476429c9 | Iran, Islamic Republic of | 364 | IR | IRN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 105 | True |
| e921d0b2-5628-4665-afce-60ca8a65e2d1 | Iraq | 368 | IQ | IRQ | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 106 | True |
| a6d3c0b6-297b-42f7-ac83-512bd3b449d7 | Ireland | 372 | IE | IRL | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 107 | True |
| afd34afd-f71a-4281-be2d-a20947751371 | Isle of Man | 833 | IM | IMN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 108 | True |
| 094a7264-8964-48a8-a6e3-487d3e8529d6 | Israel | 376 | IL | ISR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 109 | True |
| e3fcf633-26c4-48ad-bcb6-828154342183 | Italy | 380 | IT | ITA | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 110 | True |
| 6aa44a71-55c5-4e22-a971-50c8abec244d | Jamaica | 388 | JM | JAM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 111 | True |
| 83b47232-e476-4fe2-9c5f-cd494aa62b5e | Japan | 392 | JP | JPN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 112 | True |
| 473057c4-1153-4446-b47a-86528c40622a | Jersey | 832 | JE | JEY | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 113 | True |
| 391ed058-9517-4eff-8123-fa6c7b317e8a | Jordan | 400 | JO | JOR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 114 | True |
| 38f8e05b-d4e5-4fe1-89ce-a8e8a947bd96 | Kazakhstan | 398 | KZ | KAZ | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 115 | True |
| 69c7f0a4-719c-4911-a4e8-0dd2235b27aa | Kenya | 404 | KE | KEN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 116 | True |
| f997baa4-0456-4678-80f9-e8f0eb8f3540 | Kiribati | 296 | KI | KIR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 117 | True |
| e8cbe131-00a1-412e-95f3-1ed7a1984ea1 | Korea, Democratic People's Republic of | 408 | KP | PRK | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 118 | True |
| fc452d6d-bf77-4d77-8478-7a312a6ae65a | Korea, Republic of | 410 | KR | KOR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 119 | True |
| a2147057-e1c1-4ec4-9e8a-18df177d30ed | Kuwait | 414 | KW | KWT | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 120 | True |
| 6542df01-80ad-415d-9993-3cf8ab7a98d6 | Kyrgyzstan | 417 | KG | KGZ | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 121 | True |
| 0d9dd6bd-e224-495e-8264-169688263e34 | Lao People's Democratic Republic | 418 | LA | LAO | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 122 | True |
| 6ed5db00-5c92-4378-bfc6-d8ada687e330 | Latvia | 428 | LV | LVA | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 123 | True |
| 46394773-9521-4580-9421-f30a5bf7ae17 | Lebanon | 422 | LB | LBN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 124 | True |
| 59f9507a-b2f0-4b9a-983b-80d35348f638 | Lesotho | 426 | LS | LSO | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 125 | True |
| 8dc8e766-820f-4cbe-81ae-7e8368e867b0 | Liberia | 430 | LR | LBR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 126 | True |
| ecbb0fe5-1229-4570-b3e2-5c5e79d234df | Libya | 434 | LY | LBY | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 127 | True |
| 2559afb7-2535-4429-85f4-3c7371f6c21b | Liechtenstein | 438 | LI | LIE | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 128 | True |
| 3cf70e82-44d5-442e-a3de-b41e2a728f0f | Lithuania | 440 | LT | LTU | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 129 | True |
| cbbb9cc2-dbe7-4b5c-a2bd-ffa0f89c07fc | Luxembourg | 442 | LU | LUX | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 130 | True |
| 175b30a3-c299-4f61-af07-78dacd15cc98 | Macao | 446 | MO | MAC | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 131 | True |
| 9cb3b456-6614-4c0d-8f4b-b2b09f682c9c | Madagascar | 450 | MG | MDG | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 132 | True |
| 69108a68-cda7-4e36-b55d-53d94d14e1a2 | Malawi | 454 | MW | MWI | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 133 | True |
| e7410039-0907-4665-8084-8434c63e8bbf | Malaysia | 458 | MY | MYS | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 134 | True |
| 25694503-e183-41b9-8f53-5ca9d8624ec7 | Maldives | 462 | MV | MDV | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 135 | True |
| c3e74d5d-e33c-4e0f-b16b-e8cf17ce6891 | Mali | 466 | ML | MLI | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 136 | True |
| f4694e28-5e41-4b58-ab03-f1fcfa5383f3 | Malta | 470 | MT | MLT | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 137 | True |
| b43acc6a-302b-43cc-ba89-1033702d0aa6 | Marshall Islands | 584 | MH | MHL | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 138 | True |
| da621277-8d02-43f2-90cd-5106858a2014 | Martinique | 474 | MQ | MTQ | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 139 | True |
| 63adce6d-00ce-4302-9afc-b433819973b4 | Mauritania | 478 | MR | MRT | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 140 | True |
| d8f7ef48-685c-4326-9090-3023b5557a5a | Mauritius | 480 | MU | MUS | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 141 | True |
| 8f2f42f3-bd68-4668-b657-8fbf6da04870 | Mayotte | 175 | YT | MYT | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 142 | True |
| f6045a8a-f0e7-4206-be55-660cc51f2ce2 | Mexico | 484 | MX | MEX | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 143 | True |
| 555f7b73-8a0f-4745-bb45-2264d783c540 | Micronesia, Federated States of | 583 | FM | FSM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 144 | True |
| 7c84637e-fffe-4789-9c31-904f2ed333cb | Moldova, Republic of | 498 | MD | MDA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 145 | True |
| 2d0689bb-8413-4939-b254-5ae6c21df9d7 | Monaco | 492 | MC | MCO | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 146 | True |
| 9a4ef361-9164-4af2-9989-d9ed3fa41cab | Mongolia | 496 | MN | MNG | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 147 | True |
| 3a05ca32-e911-4ab5-842d-3b10a9efae1e | Montenegro | 499 | ME | MNE | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 148 | True |
| 8087abd8-592b-474a-83c2-8ce6ebac1309 | Montserrat | 500 | MS | MSR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 149 | True |
| 913b2de8-ac50-41a3-9259-22281427bdf6 | Morocco | 504 | MA | MAR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 150 | True |
| c278486e-0005-4344-bfc0-798682f352b1 | Mozambique | 508 | MZ | MOZ | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 151 | True |
| b3b82d71-a314-4fe2-91c8-c7a7fc8867cd | Myanmar | 104 | MM | MMR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 152 | True |
| c462ba10-a337-462c-b4d4-af78cfc6b8e8 | Namibia | 516 | NA | NAM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 153 | True |
| 96cd63e5-81e3-448f-a561-f5ce79fce6dc | Nauru | 520 | NR | NRU | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 154 | True |
| 105552b2-a2a3-4252-972c-da0a89bfed21 | Nepal | 524 | NP | NPL | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 155 | True |
| 0dbacb84-96b5-43d5-80cb-0eb2341697e6 | Netherlands | 528 | NL | NLD | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 156 | True |
| 08c249cc-4312-4a46-82cb-305360e4edb0 | New Caledonia | 540 | NC | NCL | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 157 | True |
| a752e05f-84cb-4f43-9aa0-4722c1914833 | New Zealand | 554 | NZ | NZL | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 158 | True |
| b0644f40-899c-4286-9d6c-06265eb600b8 | Nicaragua | 558 | NI | NIC | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 159 | True |
| 2264b08a-0f8b-4306-a53d-4b74ec272ae9 | Niger | 562 | NE | NER | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 160 | True |
| abb54235-8ff5-4398-b734-f53b8137f153 | Nigeria | 566 | NG | NGA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 161 | True |
| 2c3f5d61-8760-44ea-9194-7e92c62971e7 | Niue | 570 | NU | NIU | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 162 | True |
| 65cfc72e-cb1b-4e1f-b370-db9c7d771496 | Norfolk Island | 574 | NF | NFK | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 163 | True |
| e005fac3-851e-4b10-98a0-5880b08e6324 | North Macedonia | 807 | MK | MKD | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 164 | True |
| 0c05cf8f-bd07-444d-a518-b8ca4535a02a | Northern Mariana Islands | 580 | MP | MNP | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 165 | True |
| 1d90fb38-7fb1-49dd-b1d7-0e7c83d69402 | Norway | 578 | NO | NOR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 166 | True |
| 28d194f8-e132-49c0-8984-aa440763fd5d | Oman | 512 | OM | OMN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 167 | True |
| c5ccb0f3-0a79-4be9-93c3-9bf013ebbeba | Pakistan | 586 | PK | PAK | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 168 | True |
| 1b91904e-8e0b-4a37-977f-1cf02fa7d980 | Palau | 585 | PW | PLW | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 169 | True |
| 86ae18cd-f456-4064-8b53-25249ccf2bf3 | Palestine, State of | 275 | PS | PSE | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 170 | True |
| fa1c58e4-6eb7-4aa3-bb5d-7c42781b13e4 | Panama | 591 | PA | PAN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 171 | True |
| bd9539d2-133e-4cfa-bd50-9e2b76d89cb4 | Papua New Guinea | 598 | PG | PNG | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 172 | True |
| 3a6dd9fd-1551-47a0-b64f-2d8e8c1aa990 | Paraguay | 600 | PY | PRY | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 173 | True |
| 0e02c02a-a745-4bee-b893-70c8f729712e | Peru | 604 | PE | PER | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 174 | True |
| c074c742-d294-400e-b02f-ceb4a2e0dce6 | Philippines | 608 | PH | PHL | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 175 | True |
| e9cc6424-9a64-4f6a-a9b1-fb806bfd8f94 | Pitcairn | 612 | PN | PCN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 176 | True |
| 6a007c6e-996a-4ef3-b5f3-ea8a60d24656 | Poland | 616 | PL | POL | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 177 | True |
| 09f6cab5-d189-448e-9e4b-3236dfc7d566 | Portugal | 620 | PT | PRT | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 178 | True |
| da629ff1-fb94-46cc-8566-4fcf07920423 | Puerto Rico | 630 | PR | PRI | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 179 | True |
| 30021db6-45c9-48aa-8ddb-bb8af0e77e41 | Qatar | 634 | QA | QAT | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 180 | True |
| 04ae68a3-d7c3-4adc-8e7b-f5065acfdbcb | Romania | 642 | RO | ROU | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 181 | True |
| 7a3d1a36-82fb-46ff-b9e9-3ad0efa675ba | Russian Federation | 643 | RU | RUS | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 182 | True |
| 0a2530bc-3c5d-4a28-a2d5-34d29f6b7f8c | Rwanda | 646 | RW | RWA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 183 | True |
| 47204551-d760-4d93-ac13-49006840cc37 | Réunion | 638 | RE | REU | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 184 | True |
| 28fbbd2a-8cf3-4c97-8415-ee64ada3e197 | Saint Barthélemy | 652 | BL | BLM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 185 | True |
| 50a1ec6b-055f-4b5a-90a9-916ecd03b605 | Saint Helena, Ascension and Tristan da Cunha | 654 | SH | SHN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 186 | True |
| 25dbad2d-6096-4ac4-820f-2bdcb016e1c8 | Saint Kitts and Nevis | 659 | KN | KNA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 187 | True |
| bbe43de0-5bec-4057-979f-27c01b51cebc | Saint Lucia | 662 | LC | LCA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 188 | True |
| 0e4a0735-5101-4f7a-8a80-20d6b8754495 | Saint Martin (French part) | 663 | MF | MAF | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 189 | True |
| cc5e66c9-31ad-473d-acef-8738f00f6e09 | Saint Pierre and Miquelon | 666 | PM | SPM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 190 | True |
| d51bcebd-6412-488e-bf62-d5628cc2486a | Saint Vincent and the Grenadines | 670 | VC | VCT | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 191 | True |
| 626bd153-6958-4aec-a6d9-5571ad9e8836 | Samoa | 882 | WS | WSM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 192 | True |
| 4aa18856-feeb-40de-b407-90211e37fb5e | San Marino | 674 | SM | SMR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 193 | True |
| 21a4fc7d-caf2-49eb-a3af-62bb086e8f95 | Sao Tome and Principe | 678 | ST | STP | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 194 | True |
| e5a8a02f-fb27-4ace-a436-e969309d8e83 | Saudi Arabia | 682 | SA | SAU | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 195 | True |
| a06cdf42-852e-4289-8a2a-bd059435a982 | Senegal | 686 | SN | SEN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 196 | True |
| 8d364119-be1e-4c56-84a6-ebe8771a9108 | Serbia | 688 | RS | SRB | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 197 | True |
| 3c6db109-28e7-4a54-9388-fe23449f7ff4 | Seychelles | 690 | SC | SYC | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 198 | True |
| d6fd33ad-31e6-4865-b0ea-9ab38d55975e | Sierra Leone | 694 | SL | SLE | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 199 | True |
| c9ff3c97-7fb6-4048-b703-ee8313f9da79 | Singapore | 702 | SG | SGP | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 200 | True |
| db9cc808-1226-421d-b32a-92122f11bda3 | Sint Maarten (Dutch part) | 534 | SX | SXM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 201 | True |
| 950ea74d-7761-40d1-8475-e0467ae56b00 | Slovakia | 703 | SK | SVK | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 202 | True |
| efc94d19-4210-4e95-b073-883f9c59c53b | Slovenia | 705 | SI | SVN | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 203 | True |
| c44beab7-0fd0-4aae-a8cc-d2f25c8f96c7 | Solomon Islands | 90 | SB | SLB | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 204 | True |
| 25c7661e-6015-4afc-941f-141904a9a192 | Somalia | 706 | SO | SOM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 205 | True |
| 08ae3f56-5c3c-4c01-94e7-5e02f6f1d490 | South Africa | 710 | ZA | ZAF | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 206 | True |
| d46c01cf-f66d-434f-bd4b-b00f21bbc03a | South Georgia and the South Sandwich Islands | 239 | GS | SGS | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 207 | True |
| da09c2bf-129a-462c-a60e-59b74f4f5980 | South Sudan | 728 | SS | SSD | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 208 | True |
| bd5e3c3d-b95c-400f-bed2-ed456bb0b709 | Spain | 724 | ES | ESP | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 209 | True |
| 5935ee66-f1f7-4088-afc8-1a1e5054fad9 | Sri Lanka | 144 | LK | LKA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 210 | True |
| 7d388fce-cfec-40b1-9c55-913cbee1b430 | Sudan | 729 | SD | SDN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 211 | True |
| ce241c2e-2826-49e4-8b52-af9eee07b6c9 | Suriname | 740 | SR | SUR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 212 | True |
| d703de69-15cf-476d-a50f-2c5585c9321a | Svalbard and Jan Mayen | 744 | SJ | SJM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 213 | True |
| 7418fc47-7f09-480d-9758-b55f4fd8c02b | Sweden | 752 | SE | SWE | 1d51e50d-184f-4e9e-8126-d06f3ff4020d | 214 | True |
| be09f617-32c6-4901-ab5d-dec2f9ff0a71 | Switzerland | 756 | CH | CHE | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 215 | True |
| 5ca19d96-4544-4474-bd49-c721c98f9dd3 | Syrian Arab Republic | 760 | SY | SYR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 216 | True |
| 0a49d175-40a7-4da6-9aff-6dfea88a9346 | Taiwan, Province of China | 158 | TW | TWN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 217 | True |
| d0e097bb-66f0-47e8-8b6e-1c7fe0e00e6d | Tajikistan | 762 | TJ | TJK | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 218 | True |
| 7419419b-4062-4407-ba8b-c5ebca923ed5 | Tanzania, United Republic of | 834 | TZ | TZA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 219 | True |
| 739b9afa-7685-4f18-8d1b-705dae601d8e | Thailand | 764 | TH | THA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 220 | True |
| 480f7916-4254-4f50-9031-477f8458d7f1 | Timor-Leste | 626 | TL | TLS | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 221 | True |
| 28d68c3a-82b6-46ec-a48c-2eca742b3093 | Togo | 768 | TG | TGO | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 222 | True |
| d02b54cf-f116-4442-b861-0c7d310eb639 | Tokelau | 772 | TK | TKL | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 223 | True |
| 756ff5aa-a75c-440d-9c7b-6a584cf43483 | Tonga | 776 | TO | TON | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 224 | True |
| eef734a7-88f3-4a17-bf41-406d75100a6d | Trinidad and Tobago | 780 | TT | TTO | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 225 | True |
| 13ee326d-94fa-4aeb-8796-0a2a0b0cc68f | Tunisia | 788 | TN | TUN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 226 | True |
| 2e336422-36dc-4d29-a2b3-2943bddedfea | Turkmenistan | 795 | TM | TKM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 227 | True |
| c7f18bc2-06b3-4d13-8875-af190e1c58d2 | Turks and Caicos Islands | 796 | TC | TCA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 228 | True |
| 406a925c-9b4f-472a-999a-94b8cd75e107 | Tuvalu | 798 | TV | TUV | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 229 | True |
| 520b42b8-05a5-47e9-9293-1682a4bb5936 | Türkiye | 792 | TR | TUR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 230 | True |
| c6f5ca54-bf38-4571-aa32-5ce6b7e2e4bc | Uganda | 800 | UG | UGA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 231 | True |
| d5f5eb17-6a43-4dca-9fa2-38ab7964e709 | Ukraine | 804 | UA | UKR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 232 | True |
| 18b3106b-19b2-4c2f-9f72-6b93828d8df5 | United Arab Emirates | 784 | AE | ARE | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 233 | True |
| 47a9c5c7-5939-475d-aa28-566bdfcea4c5 | United Kingdom | 826 | GB | GBR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 234 | True |
| b9ff27dc-555b-4dba-a330-714668f0cac8 | United States | 840 | US | USA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 235 | True |
| 1374eac0-6d95-4dca-a3eb-d8979c93ea84 | United States Minor Outlying Islands | 581 | UM | UMI | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 236 | True |
| 3cef33a5-2700-441c-9b80-a110b48f204b | Uruguay | 858 | UY | URY | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 237 | True |
| 52de44d3-f1bb-406e-8dce-e8382344a80e | Uzbekistan | 860 | UZ | UZB | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 238 | True |
| a39aff11-1cbc-48c5-84f7-c07a710b35c3 | Vanuatu | 548 | VU | VUT | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 239 | True |
| ae8e4ba2-6ff2-4777-a32d-3b1bef005238 | Venezuela, Bolivarian Republic of | 862 | VE | VEN | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 240 | True |
| 46c2fb28-fe02-418a-838f-dba983115655 | Viet Nam | 704 | VN | VNM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 241 | True |
| e0fd9794-51f7-4828-88ca-cf72cc15c698 | Virgin Islands, British | 92 | VG | VGB | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 242 | True |
| fff511c4-fea0-4432-aae7-fa9636c884ba | Virgin Islands, U.S. | 850 | VI | VIR | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 243 | True |
| 70e3e56e-423f-4adc-bdee-d004cfd71f24 | Wallis and Futuna | 876 | WF | WLF | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 244 | True |
| e257edce-012f-4dc2-91dd-ce239716150e | Western Sahara | 732 | EH | ESH | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 245 | True |
| f4ad2c3b-3996-470c-9225-e4ba364cd9b3 | Yemen | 887 | YE | YEM | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 246 | True |
| 49c15fed-0a7d-4cbb-a811-c849b2ae19f9 | Zambia | 894 | ZM | ZMB | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 247 | True |
| b98cc30b-8a89-474b-a45d-84f3b06a8a64 | Zimbabwe | 716 | ZW | ZWE | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 248 | True |
| f43eab06-ed43-4617-aa46-b785b0517d10 | Åland Islands | 248 | AX | ALA | 22348aa7-b9b7-4c34-b928-c72d7893bd56 | 249 | True |
