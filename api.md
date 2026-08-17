---
title: Default module
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# Default module

Base URLs:

# Authentication

# Default

## GET 查詢使用者訂閱列表

GET /ael/ecpay/subscription/list

查詢使用者訂閱列表

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|userUuid|query|string| no |none|

> Response Examples

> 200 Response

```json
{
    "data": [
        {
            "userUuid": "d76d7de6-da38-4d49-bb42-dc7204708a85",
            "productId": "B001",
            "costAction": 1,
            "totalSuccessTime": 2,
            "totalSuccessAmount": 6000,
            "merchantCodeList": [
                "RELA20262300001",
                "RELA20262300001002"
            ],
            "currentPaymentDate": "2026-06-01T17:03:50Z",
            "nextPaymentDate": "2026-08-01T04:33:13Z",
            "active": 1,
            "stopDate": null,
            "isTrial": 0,
            "trialStartTime": "2026-05-25T07:58:13Z",
            "trialEndTime": "2026-06-01T07:58:13Z"
        },
        {
            "userUuid": "d76d7de6-da38-4d49-bb42-dc7204708a85",
            "productId": "B003",
            "costAction": 1,
            "totalSuccessTime": 1,
            "totalSuccessAmount": 650,
            "merchantCodeList": [
                "RELA20262300001"
            ],
            "currentPaymentDate": "2026-06-01T04:33:13Z",
            "nextPaymentDate": "2026-07-01T04:33:13Z",
            "active": 1,
            "stopDate": null,
            "isTrial": 0,
            "trialStartTime": null,
            "trialEndTime": null
        }
    ],
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[object]|true|none||none|
|»» userUuid|string|true|none||none|
|»» productId|string|true|none||none|
|»» costAction|integer|true|none||none|
|»» totalSuccessTime|integer|true|none||none|
|»» totalSuccessAmount|integer|true|none||none|
|»» merchantCodeList|[string]|true|none||none|
|»» currentPaymentDate|string|true|none||none|
|»» nextPaymentDate|string|true|none||none|
|»» active|integer|true|none||none|
|»» stopDate|null|true|none||none|
|»» isTrial|integer|true|none||none|
|»» trialStartTime|string¦null|true|none||none|
|»» trialEndTime|string¦null|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## POST 產出指定扣繳種類的扣繳繳款書

POST /ael/onboarding/documents/withholding

> Body Parameters

```json
{
    "fixedSalary": 50000,
    "variableSalary": 100000,
    "year": 2026,
    "month": 5,
    "payDate": "20260605",
    "incomeCode": "50",
    "taxIdNumber": "93790155",
    "companyName": "友信創新股份有限公司",
    "headName": "彭建彰",
    "contactName": "彭建彰",
    "contactPhone": "0906744063",
    "companyAddr": "臺北市內湖區瑞光路358巷30弄6號6樓",
    "isOverDeadline": false
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» fixedSalary|body|integer| yes |固定薪資|
|» variableSalary|body|integer| yes |非固定薪資|
|» year|body|integer| yes |所得所屬年|
|» month|body|integer| yes |所得所屬月|
|» payDate|body|string| yes |給付日期|
|» incomeCode|body|string| yes |各類扣繳種類代號（50=薪資, 9A=執行業務, 9B=稿費, 51=租金,53=權利金,91=中獎獎金,92=其他所得,93=退職所得,97=受贈所得,5B其他利息）|
|» taxIdNumber|body|string| yes |統編|
|» companyName|body|string| yes |公司名稱|
|» headName|body|string| yes |公司負責人|
|» contactName|body|string| yes |公司聯絡人|
|» contactPhone|body|string| yes |聯絡電話|
|» companyAddr|body|string| yes |公司地址|
|» isOverDeadline|body|boolean| yes |是否已超過繳納期限|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "data": {
        "type": "withholding_slip",
        "payDate": "1150103",
        "downloadUrl": "/api/onboarding/salary/documents/withholding-1150103.pdf"
    },
    "errorCode": "0000",
    "message": "操作成功"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» data|object|true|none||none|
|»» type|string|true|none||繳款書類型|
|»» payDate|string|true|none||none|
|»» downloadUrl|string|true|none||none|
|» errorCode|string¦null|true|none||none|
|» message|string|false|none||none|

## POST 產出指定扣繳種類的二代健保補充保費繳款書

POST /ael/onboarding/documents/nhi

產出指定扣繳種類的二代健保補充保費繳款書

> Body Parameters

```json
{
    "fixedSalary": 50000,
    "variableSalary": 300000,
    "year": 2026,
    "month": 5,
    "incomeCode": "50",
    "isNhi": true,
    "nhiGradeId": 500,
    "taxIdNumber": "93790155",
    "companyName": "友信創新股份有限公司",
    "headName": "彭建彰",
    "contactName": "彭建彰",
    "contactPhone": "0906744063",
    "companyAddr": "臺北市內湖區瑞光路358巷30弄6號6樓"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» fixedSalary|body|integer| yes |固定薪資|
|» variableSalary|body|integer| yes |非固定薪資|
|» year|body|integer| yes |所得所屬年|
|» month|body|integer| yes |所得所屬月|
|» incomeCode|body|string| yes |各類扣繳種類代號（50=薪資, 9A=執行業務, 9B=稿費, 51=租金,53=權利金,91=中獎獎金,92=其他所得,93=退職所得,97=受贈所得,5B其他利息）|
|» isNhi|body|boolean| yes |有投保健保嗎|
|» nhiGradeId|body|integer| yes |健保投保級距 ID|
|» taxIdNumber|body|string| yes |統編|
|» companyName|body|string| yes |公司名稱|
|» headName|body|string| yes |公司負責人|
|» contactName|body|string| yes |公司聯絡人|
|» contactPhone|body|string| yes |聯絡電話|
|» companyAddr|body|string| yes |公司地址|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET 獲取當期發票數量統計

GET /invoice/count

獲取當期發票數量統計

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|uuid|query|string| no |公司uuid|
|year|query|string| no |民國年|
|phase|query|string| no |期|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 單張發票 Gemini 結構化辨識

POST /ael/invoice/identification/one

單張發票 Gemini 結構化辨識

> Body Parameters

```yaml
ac_uuid: ""
isbuy: ""
file: ""

```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» ac_uuid|body|string| no |公司uuid|
|» isbuy|body|boolean| no |true進項,false銷項|
|» file|body|string(binary)| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# 導入流程

## GET 根據統編查詢公司資訊

GET /ael/onboarding/company-lookup

統編查詢公司資訊，選填才呼叫

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|taxId|query|string| no |統一編號|

> Response Examples

> 200 Response

```json
{
  "success": true,
  "data": {
    "companyName": "超級有限公司",
    "representative": "王小明",
    "address": "臺北市內湖區瑞光路358巷30弄6號6樓"
  },
  "errorCode": "0000",
  "message": "操作成功"
}
```

> 503 Response

```json
{
    "data": {
        "companyAddress": "南投縣中寮鄉中寮村永平路３７１號一樓",
        "companyName": "原味商行"
    },
    "errorCode": "0035",
    "message": "查詢逾時，請稍後再試",
    "success": false
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|503|[Service Unavailable](https://tools.ietf.org/html/rfc7231#section-6.6.4)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» data|object|true|none||none|
|»» companyName|string|true|none||none|
|»» representative|string|true|none||負責人|
|»» address|string|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|

HTTP Status Code **503**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» data|object|true|none||none|
|»» companyName|null|true|none||none|
|»» representative|null|true|none||none|
|»» address|null|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|

## POST 單張憑證辨識

POST /ael/onboarding/invoiceRecognition

提供單張憑證 ai 辨識結果

> Body Parameters

```yaml
file: ""
companyDescription: ""
companySalesMode: ""

```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» file|body|string(binary)| no |none|
|» companyDescription|body|string| no |公司主要營業介紹|
|» companySalesMode|body|string| no |公司主要銷售模式（both：都有 online：網路 physical：實體）|

> Response Examples

> 200 Response

```json
{
    "data": {
        "geminiMs": 4450,
        "items": [
            {
                "invoice_direction": "buy",
                "angle": 270,
                "document_template": 1,
                "gui_type": 2,
                "gui_subject_candidates": [
                    {
                        "gui_subject": "雜項購置",
                        "gui_subject_category": "費用",
                        "reason": "品項為椰子餅盒，屬食品或禮盒類購置"
                    },
                    {
                        "gui_subject": "交際費",
                        "gui_subject_category": "費用",
                        "reason": "若購入食品禮盒用於客戶公關餽贈則歸此"
                    },
                    {
                        "gui_subject": "職工福利",
                        "gui_subject_category": "費用",
                        "reason": "若購入食品餅乾供員工內部點心食用則歸此"
                    }
                ],
                "gui_alphabetic_letter": null,
                "gui_date_year": 115,
                "gui_date_month": 1,
                "gui_date_day": 8,
                "gui_number": "VV19926505",
                "seller_name": "燕林堂菓子企劃有限公司",
                "seller_tax_id": "60796506",
                "buyer_name": "Sunny",
                "buyer_tax_id": null,
                "subtotal": null,
                "tax_free_amount": null,
                "tax": null,
                "others": null,
                "total_amount": 2500
            }
        ],
        "totalMs": 4455
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» geminiMs|integer|true|none||none|
|»» items|[object]|true|none||none|
|»»» invoice_direction|string|false|none||sale: 銷項 buy: 進項 unknown:都不是|
|»»» angle|integer|false|none||角度|
|»»» document_template|integer|false|none||發票種類（模板用）|
|»»» gui_type|integer|false|none||進項種類|
|»»» gui_subject_candidates|[object]|false|none||推薦科目|
|»»»» gui_subject|string|true|none||費用類別|
|»»»» gui_subject_category|string|true|none||發票大概用處|
|»»»» reason|string|true|none||原因|
|»»» gui_alphabetic_letter|null|false|none||發票字軌|
|»»» gui_date_year|integer|false|none||開立年|
|»»» gui_date_month|integer|false|none||開立月|
|»»» gui_date_day|integer|false|none||開立日|
|»»» gui_number|string|false|none||發票號碼|
|»»» seller_name|string|false|none||賣方名稱|
|»»» seller_tax_id|string|false|none||賣方統編|
|»»» buyer_name|string|false|none||買方名稱|
|»»» buyer_tax_id|null|false|none||買方統編|
|»»» subtotal|null|false|none||銷售額|
|»»» tax_free_amount|null|false|none||免稅銷售額|
|»»» tax|null|false|none||稅額|
|»»» others|null|false|none||其他費用|
|»»» total_amount|integer|false|none||總金額|
|»» totalMs|integer|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## GET 取得所有保險級距詳細資料

GET /ael/onboarding/salary/insurance

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|year|query|string| no |西元年|

> Response Examples

> 200 Response

```json
{
    "laborGrades": [
        {
            "id": 637,
            "grade": 0,
            "salaryMin": 0,
            "salaryMax": 0,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 546,
            "grade": 1,
            "salaryMin": 0,
            "salaryMax": 11100,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 547,
            "grade": 2,
            "salaryMin": 11101,
            "salaryMax": 12540,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 548,
            "grade": 3,
            "salaryMin": 12541,
            "salaryMax": 13500,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 549,
            "grade": 4,
            "salaryMin": 13501,
            "salaryMax": 15840,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 550,
            "grade": 5,
            "salaryMin": 15841,
            "salaryMax": 16500,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 551,
            "grade": 6,
            "salaryMin": 16501,
            "salaryMax": 17280,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 552,
            "grade": 7,
            "salaryMin": 17281,
            "salaryMax": 17880,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 553,
            "grade": 8,
            "salaryMin": 17881,
            "salaryMax": 19047,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 554,
            "grade": 9,
            "salaryMin": 19048,
            "salaryMax": 20008,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 555,
            "grade": 10,
            "salaryMin": 20009,
            "salaryMax": 21009,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 556,
            "grade": 11,
            "salaryMin": 21010,
            "salaryMax": 22000,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 557,
            "grade": 12,
            "salaryMin": 22001,
            "salaryMax": 23100,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 558,
            "grade": 13,
            "salaryMin": 23101,
            "salaryMax": 24000,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 559,
            "grade": 14,
            "salaryMin": 24001,
            "salaryMax": 25250,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 560,
            "grade": 15,
            "salaryMin": 25251,
            "salaryMax": 26400,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 561,
            "grade": 16,
            "salaryMin": 26401,
            "salaryMax": 27600,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 562,
            "grade": 17,
            "salaryMin": 27601,
            "salaryMax": 28590,
            "isParttime": true,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 563,
            "grade": 18,
            "salaryMin": 28591,
            "salaryMax": 29500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 564,
            "grade": 19,
            "salaryMin": 29501,
            "salaryMax": 30300,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 565,
            "grade": 20,
            "salaryMin": 30301,
            "salaryMax": 31800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 566,
            "grade": 21,
            "salaryMin": 31801,
            "salaryMax": 33300,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 567,
            "grade": 22,
            "salaryMin": 33301,
            "salaryMax": 34800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 568,
            "grade": 23,
            "salaryMin": 34801,
            "salaryMax": 36300,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 569,
            "grade": 24,
            "salaryMin": 36301,
            "salaryMax": 38200,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 570,
            "grade": 25,
            "salaryMin": 38201,
            "salaryMax": 40100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 571,
            "grade": 26,
            "salaryMin": 40101,
            "salaryMax": 42000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 572,
            "grade": 27,
            "salaryMin": 42001,
            "salaryMax": 43900,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 573,
            "grade": 28,
            "salaryMin": 43901,
            "salaryMax": 45800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        }
    ],
    "laborPensionGrades": [
        {
            "id": 574,
            "grade": 1,
            "salaryMin": 0,
            "salaryMax": 1500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 575,
            "grade": 2,
            "salaryMin": 1501,
            "salaryMax": 3000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 576,
            "grade": 3,
            "salaryMin": 3001,
            "salaryMax": 4500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 577,
            "grade": 4,
            "salaryMin": 4501,
            "salaryMax": 6000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 578,
            "grade": 5,
            "salaryMin": 6001,
            "salaryMax": 7500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 579,
            "grade": 6,
            "salaryMin": 7501,
            "salaryMax": 8700,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 580,
            "grade": 7,
            "salaryMin": 8701,
            "salaryMax": 9900,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 581,
            "grade": 8,
            "salaryMin": 9901,
            "salaryMax": 11100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 582,
            "grade": 9,
            "salaryMin": 11101,
            "salaryMax": 12540,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 583,
            "grade": 10,
            "salaryMin": 12541,
            "salaryMax": 13500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 584,
            "grade": 11,
            "salaryMin": 13501,
            "salaryMax": 15840,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 585,
            "grade": 12,
            "salaryMin": 15841,
            "salaryMax": 16500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 586,
            "grade": 13,
            "salaryMin": 16501,
            "salaryMax": 17280,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 587,
            "grade": 14,
            "salaryMin": 17281,
            "salaryMax": 17880,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 588,
            "grade": 15,
            "salaryMin": 17881,
            "salaryMax": 19047,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 589,
            "grade": 16,
            "salaryMin": 19048,
            "salaryMax": 20008,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 590,
            "grade": 17,
            "salaryMin": 20009,
            "salaryMax": 21009,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 591,
            "grade": 18,
            "salaryMin": 21010,
            "salaryMax": 22000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 592,
            "grade": 19,
            "salaryMin": 22001,
            "salaryMax": 23100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 593,
            "grade": 20,
            "salaryMin": 23101,
            "salaryMax": 24000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 594,
            "grade": 21,
            "salaryMin": 24001,
            "salaryMax": 25250,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 595,
            "grade": 22,
            "salaryMin": 25251,
            "salaryMax": 26400,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 596,
            "grade": 23,
            "salaryMin": 26401,
            "salaryMax": 27600,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 597,
            "grade": 24,
            "salaryMin": 27601,
            "salaryMax": 28590,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 598,
            "grade": 25,
            "salaryMin": 28591,
            "salaryMax": 29500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 599,
            "grade": 26,
            "salaryMin": 29501,
            "salaryMax": 30300,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 600,
            "grade": 27,
            "salaryMin": 30301,
            "salaryMax": 31800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 601,
            "grade": 28,
            "salaryMin": 31801,
            "salaryMax": 33300,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 602,
            "grade": 29,
            "salaryMin": 33301,
            "salaryMax": 34800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 603,
            "grade": 30,
            "salaryMin": 34801,
            "salaryMax": 36300,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 604,
            "grade": 31,
            "salaryMin": 36301,
            "salaryMax": 38200,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 605,
            "grade": 32,
            "salaryMin": 38201,
            "salaryMax": 40100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 606,
            "grade": 33,
            "salaryMin": 40101,
            "salaryMax": 42000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 607,
            "grade": 34,
            "salaryMin": 42001,
            "salaryMax": 43900,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 608,
            "grade": 35,
            "salaryMin": 43901,
            "salaryMax": 45800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 609,
            "grade": 36,
            "salaryMin": 45801,
            "salaryMax": 48200,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 610,
            "grade": 37,
            "salaryMin": 48201,
            "salaryMax": 50600,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 611,
            "grade": 38,
            "salaryMin": 50601,
            "salaryMax": 53000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 612,
            "grade": 39,
            "salaryMin": 53001,
            "salaryMax": 55400,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 613,
            "grade": 40,
            "salaryMin": 55401,
            "salaryMax": 57800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 614,
            "grade": 41,
            "salaryMin": 57801,
            "salaryMax": 60800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 615,
            "grade": 42,
            "salaryMin": 60801,
            "salaryMax": 63800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 616,
            "grade": 43,
            "salaryMin": 63801,
            "salaryMax": 66800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 617,
            "grade": 44,
            "salaryMin": 66801,
            "salaryMax": 69800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 618,
            "grade": 45,
            "salaryMin": 69801,
            "salaryMax": 72800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 619,
            "grade": 46,
            "salaryMin": 72801,
            "salaryMax": 76500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 620,
            "grade": 47,
            "salaryMin": 76501,
            "salaryMax": 80200,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 621,
            "grade": 48,
            "salaryMin": 80201,
            "salaryMax": 83900,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 622,
            "grade": 49,
            "salaryMin": 83901,
            "salaryMax": 87600,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 623,
            "grade": 50,
            "salaryMin": 87601,
            "salaryMax": 92100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 624,
            "grade": 51,
            "salaryMin": 92101,
            "salaryMax": 96600,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 625,
            "grade": 52,
            "salaryMin": 96601,
            "salaryMax": 101100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 626,
            "grade": 53,
            "salaryMin": 101101,
            "salaryMax": 105600,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 627,
            "grade": 54,
            "salaryMin": 105601,
            "salaryMax": 110100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 628,
            "grade": 55,
            "salaryMin": 110101,
            "salaryMax": 115500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 629,
            "grade": 56,
            "salaryMin": 115501,
            "salaryMax": 120900,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 630,
            "grade": 57,
            "salaryMin": 120901,
            "salaryMax": 126300,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 631,
            "grade": 58,
            "salaryMin": 126301,
            "salaryMax": 131700,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 632,
            "grade": 59,
            "salaryMin": 131701,
            "salaryMax": 137100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 633,
            "grade": 60,
            "salaryMin": 137101,
            "salaryMax": 142500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 634,
            "grade": 61,
            "salaryMin": 142501,
            "salaryMax": 147900,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 635,
            "grade": 62,
            "salaryMin": 147901,
            "salaryMax": null,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        }
    ],
    "nhiGrades": [
        {
            "id": 636,
            "grade": 0,
            "salaryMin": 0,
            "salaryMax": 0,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 488,
            "grade": 1,
            "salaryMin": 0,
            "salaryMax": 29500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 489,
            "grade": 2,
            "salaryMin": 29501,
            "salaryMax": 30300,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 490,
            "grade": 3,
            "salaryMin": 30301,
            "salaryMax": 31800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 491,
            "grade": 4,
            "salaryMin": 31801,
            "salaryMax": 33300,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 492,
            "grade": 5,
            "salaryMin": 33301,
            "salaryMax": 34800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 493,
            "grade": 6,
            "salaryMin": 34801,
            "salaryMax": 36300,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 494,
            "grade": 7,
            "salaryMin": 36301,
            "salaryMax": 38200,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 495,
            "grade": 8,
            "salaryMin": 38201,
            "salaryMax": 40100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 496,
            "grade": 9,
            "salaryMin": 40101,
            "salaryMax": 42000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 497,
            "grade": 10,
            "salaryMin": 42001,
            "salaryMax": 43900,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 498,
            "grade": 11,
            "salaryMin": 43901,
            "salaryMax": 45800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 499,
            "grade": 12,
            "salaryMin": 45801,
            "salaryMax": 48200,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 500,
            "grade": 13,
            "salaryMin": 48201,
            "salaryMax": 50600,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 501,
            "grade": 14,
            "salaryMin": 50601,
            "salaryMax": 53000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 502,
            "grade": 15,
            "salaryMin": 53001,
            "salaryMax": 55400,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 503,
            "grade": 16,
            "salaryMin": 55401,
            "salaryMax": 57800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 504,
            "grade": 17,
            "salaryMin": 57801,
            "salaryMax": 60800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 505,
            "grade": 18,
            "salaryMin": 60801,
            "salaryMax": 63800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 506,
            "grade": 19,
            "salaryMin": 63801,
            "salaryMax": 66800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 507,
            "grade": 20,
            "salaryMin": 66801,
            "salaryMax": 69800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 508,
            "grade": 21,
            "salaryMin": 69801,
            "salaryMax": 72800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 509,
            "grade": 22,
            "salaryMin": 72801,
            "salaryMax": 76500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 510,
            "grade": 23,
            "salaryMin": 76501,
            "salaryMax": 80200,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 511,
            "grade": 24,
            "salaryMin": 80201,
            "salaryMax": 83900,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 512,
            "grade": 25,
            "salaryMin": 83901,
            "salaryMax": 87600,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 513,
            "grade": 26,
            "salaryMin": 87601,
            "salaryMax": 92100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 514,
            "grade": 27,
            "salaryMin": 92101,
            "salaryMax": 96600,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 515,
            "grade": 28,
            "salaryMin": 96601,
            "salaryMax": 101100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 516,
            "grade": 29,
            "salaryMin": 101101,
            "salaryMax": 105600,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 517,
            "grade": 30,
            "salaryMin": 105601,
            "salaryMax": 110100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 518,
            "grade": 31,
            "salaryMin": 110101,
            "salaryMax": 115500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 519,
            "grade": 32,
            "salaryMin": 115501,
            "salaryMax": 120900,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 520,
            "grade": 33,
            "salaryMin": 120901,
            "salaryMax": 126300,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 521,
            "grade": 34,
            "salaryMin": 126301,
            "salaryMax": 131700,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 522,
            "grade": 35,
            "salaryMin": 131701,
            "salaryMax": 137100,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 523,
            "grade": 36,
            "salaryMin": 137101,
            "salaryMax": 142500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 524,
            "grade": 37,
            "salaryMin": 142501,
            "salaryMax": 147900,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 525,
            "grade": 38,
            "salaryMin": 147901,
            "salaryMax": 150000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 526,
            "grade": 39,
            "salaryMin": 150001,
            "salaryMax": 156400,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 527,
            "grade": 40,
            "salaryMin": 156401,
            "salaryMax": 162800,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 528,
            "grade": 41,
            "salaryMin": 162801,
            "salaryMax": 169200,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 529,
            "grade": 42,
            "salaryMin": 169201,
            "salaryMax": 175600,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 530,
            "grade": 43,
            "salaryMin": 175601,
            "salaryMax": 182000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 531,
            "grade": 44,
            "salaryMin": 182001,
            "salaryMax": 189500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 532,
            "grade": 45,
            "salaryMin": 189501,
            "salaryMax": 197000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 533,
            "grade": 46,
            "salaryMin": 197001,
            "salaryMax": 204500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 534,
            "grade": 47,
            "salaryMin": 204501,
            "salaryMax": 212000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 535,
            "grade": 48,
            "salaryMin": 212001,
            "salaryMax": 219500,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 536,
            "grade": 49,
            "salaryMin": 219501,
            "salaryMax": 228200,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 537,
            "grade": 50,
            "salaryMin": 228201,
            "salaryMax": 236900,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 538,
            "grade": 51,
            "salaryMin": 236901,
            "salaryMax": 245600,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 539,
            "grade": 52,
            "salaryMin": 245601,
            "salaryMax": 254300,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 540,
            "grade": 53,
            "salaryMin": 254301,
            "salaryMax": 263000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 541,
            "grade": 54,
            "salaryMin": 263001,
            "salaryMax": 273000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 542,
            "grade": 55,
            "salaryMin": 273001,
            "salaryMax": 283000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 543,
            "grade": 56,
            "salaryMin": 283001,
            "salaryMax": 293000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 544,
            "grade": 57,
            "salaryMin": 293001,
            "salaryMax": 303000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        },
        {
            "id": 545,
            "grade": 58,
            "salaryMin": 303001,
            "salaryMax": 313000,
            "isParttime": false,
            "effectiveStart": "2026-01-01T00:00:00Z",
            "effectiveEnd": "2026-12-31T00:00:00Z"
        }
    ]
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» laborGrades|[object]|true|none||勞保|
|»» id|integer|true|none||none|
|»» grade|integer|true|none||none|
|»» salaryMin|integer|true|none||none|
|»» salaryMax|integer|true|none||none|
|»» isParttime|boolean|true|none||none|
|»» effectiveStart|string|true|none||none|
|»» effectiveEnd|string|true|none||none|
|» laborPensionGrades|[object]|true|none||勞退|
|»» id|integer|true|none||none|
|»» grade|integer|true|none||none|
|»» salaryMin|integer|true|none||none|
|»» salaryMax|integer¦null|true|none||none|
|»» isParttime|boolean|true|none||none|
|»» effectiveStart|string|true|none||none|
|»» effectiveEnd|string|true|none||none|
|» nhiGrades|[object]|true|none||健保|
|»» id|integer|true|none||none|
|»» grade|integer|true|none||none|
|»» salaryMin|integer|true|none||none|
|»» salaryMax|integer|true|none||none|
|»» isParttime|boolean|true|none||none|
|»» effectiveStart|string|true|none||none|
|»» effectiveEnd|string|true|none||none|

## POST 生成指定扣繳種類的扣繳繳款預覽內容

POST /ael/onboarding/preview/withholding

生成指定扣繳種類的扣繳繳款預覽內容

> Body Parameters

```json
{
    "fixedSalary": 50000,
    "variableSalary": 100000,
    "year": 2026,
    "month": 5,
    "payDate": "20260605",
    "incomeCode": "50"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» fixedSalary|body|integer| yes |固定薪資|
|» variableSalary|body|integer| yes |非固定薪資|
|» year|body|integer| yes |所得所屬年|
|» month|body|integer| yes |所得所屬月|
|» payDate|body|string| yes |給付日期|
|» incomeCode|body|string| yes |各類扣繳種類代號（50=薪資, 9A=執行業務, 9B=稿費, 51=租金,53=權利金,91=中獎獎金,92=其他所得,93=退職所得,97=受贈所得,5B其他利息）|

> Response Examples

> 200 Response

```json
{
    "data": {
        "fixedSalary": 50000,
        "fixedSalaryTaxWithheldSum": 2500,
        "incomeMonth": 5,
        "incomeYearROC": 115,
        "nonFixedSalaryTaxWithheldSum": 5000,
        "paymentDay": 5,
        "paymentMonth": 6,
        "paymentYearROC": 115,
        "totalSalary": 150000,
        "totalTaxWithheld": 7500,
        "variableSalary": 100000
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 生成指定扣繳種類的二代健保補充保費預覽內容

POST /ael/onboarding/preview/nhi

生成指定扣繳種類的二代健保補充保費預覽內容

> Body Parameters

```json
{
    "fixedSalary": 50000,
    "variableSalary": 300000,
    "year": 2026,
    "month": 5,
    "incomeCode": "50",
    "isNhi": true,
    "nhiGradeId": 500
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» fixedSalary|body|integer| yes |固定薪資|
|» variableSalary|body|integer| yes |非固定薪資|
|» year|body|integer| yes |所得所屬年|
|» month|body|integer| yes |所得所屬月|
|» incomeCode|body|string| yes |各類扣繳種類代號（50=薪資, 9A=執行業務, 9B=稿費, 51=租金,53=權利金,91=中獎獎金,92=其他所得,93=退職所得,97=受贈所得,5B其他利息）|
|» isNhi|body|boolean| yes |有投保健保嗎|
|» nhiGradeId|body|integer| yes |健保投保級距 ID|

> Response Examples

> 200 Response

```json
{
    "data": {
        "incomeCategory": "四倍以上投保金額的獎金",
        "incomeCode": "62",
        "incomeMonth": 5,
        "incomeYearROC": 115,
        "insuranceFee": 2059,
        "type": "fulltime"
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 計算薪資扣繳與勞健保費用

POST /ael/onboarding/salary/calculate

> Body Parameters

```json
{
  "fixedSalary": 50000,
  "variableSalary": 100000,
  "payDate": "20260505",
  "laborLevelId": 573,
  "nhiLevelId": 500,
  "nhiDependents": 2,
  "voluntaryPensionId": 610,
  "voluntaryPensionRate": 6
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» fixedSalary|body|integer| yes |固定薪資|
|» variableSalary|body|integer| yes |非固定薪資|
|» payDate|body|string| yes |給付日期|
|» laborLevelId|body|integer| yes |勞保等級ID|
|» nhiLevelId|body|integer| yes |健保等級ID|
|» nhiDependents|body|integer| yes |扶養人數|
|» voluntaryPensionId|body|integer| yes |勞退等級ID|
|» voluntaryPensionRate|body|integer| yes |勞退自提 % 數|

> Response Examples

> 200 Response

```json
{
    "data": {
        "healthInsurance": {
            "companyAmount": 3233,
            "employeeAmount": 1036,
            "governmentAmount": 539
        },
        "laborInsurance": {
            "companyAmount": 0,
            "employeeAmount": 0
        },
        "volPension": 0,
        "withholding": 2500
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» healthInsurance|object|true|none||none|
|»»» companyAmount|integer|true|none||none|
|»»» employeeAmount|integer|true|none||none|
|»»» governmentAmount|integer|true|none||none|
|»» laborInsurance|object|true|none||none|
|»»» companyAmount|integer|true|none||none|
|»»» employeeAmount|integer|true|none||none|
|»» volPension|integer|true|none||none|
|»» withholding|integer|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## GET 取得所有行業類別及其預設營業額與淨利率

GET /ael/onboarding/tax/industries

> Response Examples

> 200 Response

```json
{
    "data": [
        {
            "id": 1,
            "industryName": "手搖飲店",
            "costExpenseRate": 55,
            "employeeSalaryRate": 25,
            "netProfitRate": 20,
            "expandedAuditProfitRate": 6,
            "inputTaxDeductionRate": 50,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 2,
            "industryName": "早午餐/輕食",
            "costExpenseRate": 57,
            "employeeSalaryRate": 28,
            "netProfitRate": 15,
            "expandedAuditProfitRate": 6,
            "inputTaxDeductionRate": 48,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 3,
            "industryName": "特色火鍋/燒烤",
            "costExpenseRate": 66,
            "employeeSalaryRate": 22,
            "netProfitRate": 12,
            "expandedAuditProfitRate": 7,
            "inputTaxDeductionRate": 60,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 4,
            "industryName": "網頁/程式設計",
            "costExpenseRate": 20,
            "employeeSalaryRate": 55,
            "netProfitRate": 25,
            "expandedAuditProfitRate": 7,
            "inputTaxDeductionRate": 10,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 5,
            "industryName": "數位廣告代理",
            "costExpenseRate": 47,
            "employeeSalaryRate": 40,
            "netProfitRate": 13,
            "expandedAuditProfitRate": 7,
            "inputTaxDeductionRate": 60,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 6,
            "industryName": "網購電商",
            "costExpenseRate": 73,
            "employeeSalaryRate": 12,
            "netProfitRate": 15,
            "expandedAuditProfitRate": 6,
            "inputTaxDeductionRate": 70,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 7,
            "industryName": "美妝/藥妝零售",
            "costExpenseRate": 73,
            "employeeSalaryRate": 15,
            "netProfitRate": 12,
            "expandedAuditProfitRate": 6,
            "inputTaxDeductionRate": 70,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 8,
            "industryName": "二手車銷售",
            "costExpenseRate": 89,
            "employeeSalaryRate": 5,
            "netProfitRate": 6,
            "expandedAuditProfitRate": 6,
            "inputTaxDeductionRate": 85,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 9,
            "industryName": "寵物美容用品",
            "costExpenseRate": 52,
            "employeeSalaryRate": 30,
            "netProfitRate": 18,
            "expandedAuditProfitRate": 7,
            "inputTaxDeductionRate": 50,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 10,
            "industryName": "電子零件批發",
            "costExpenseRate": 91,
            "employeeSalaryRate": 4,
            "netProfitRate": 5,
            "expandedAuditProfitRate": 6,
            "inputTaxDeductionRate": 92,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 11,
            "industryName": "室內設計修繕",
            "costExpenseRate": 70,
            "employeeSalaryRate": 15,
            "netProfitRate": 15,
            "expandedAuditProfitRate": 7,
            "inputTaxDeductionRate": 70,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 12,
            "industryName": "美容美髮/美甲",
            "costExpenseRate": 25,
            "employeeSalaryRate": 45,
            "netProfitRate": 30,
            "expandedAuditProfitRate": 6,
            "inputTaxDeductionRate": 15,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 13,
            "industryName": "自助洗衣",
            "costExpenseRate": 60,
            "employeeSalaryRate": 5,
            "netProfitRate": 35,
            "expandedAuditProfitRate": 6,
            "inputTaxDeductionRate": 40,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 14,
            "industryName": "健身房/工作室",
            "costExpenseRate": 32,
            "employeeSalaryRate": 50,
            "netProfitRate": 18,
            "expandedAuditProfitRate": 7,
            "inputTaxDeductionRate": 25,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        },
        {
            "id": 15,
            "industryName": "房屋仲介/代銷",
            "costExpenseRate": 20,
            "employeeSalaryRate": 60,
            "netProfitRate": 20,
            "expandedAuditProfitRate": 7,
            "inputTaxDeductionRate": 15,
            "defaultRevenue": 3000000,
            "createTime": "2026-05-13T15:21:33Z",
            "updateTime": "2026-05-13T16:24:10Z"
        }
    ],
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[object]|true|none||none|
|»» id|integer|true|none||none|
|»» industryName|string|true|none||產業名稱|
|»» costExpenseRate|integer|true|none||成本費用率|
|»» employeeSalaryRate|integer|true|none||員工薪資率|
|»» netProfitRate|integer|true|none||淨利率|
|»» expandedAuditProfitRate|integer|true|none||擴大書審淨利率|
|»» inputTaxDeductionRate|integer|true|none||進項可扣抵率|
|»» defaultRevenue|integer|true|none||預設營業額|
|»» createTime|string|true|none||none|
|»» updateTime|string|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## POST 預估應納稅金

POST /ael/onboarding/tax/estimate

> Body Parameters

```json
{
    "revenue": 3000000,
    "costAndExpense": 2031000,
    "employeeSalary": 300000,
    "personalRent": 300000,
    "otherExpense": 0,
    "industryIncomeId": 4,
    "netProfitRate": 20,
    "expandedAuditProfitRate": 6,
    "isAdvanced": true
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» revenue|body|integer| yes |收入|
|» costAndExpense|body|integer| yes |成本及費用|
|» employeeSalary|body|integer| yes |員工薪資|
|» personalRent|body|integer| yes |個人房東租金|
|» otherExpense|body|integer| yes |其他費用|
|» industryIncomeId|body|integer| yes |行業各業所得ID|
|» netProfitRate|body|integer| yes |淨利率|
|» expandedAuditProfitRate|body|integer| yes |擴大書審淨利率|
|» isAdvanced|body|boolean| yes |是否為進階模式|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "data": {
        "biPhaselyBusinessTax": {
            "amount": 9325
        },
        "annualIncomeTax": {
            "bookReview": {
                "amount": 0
            },
            "documentReview": {
                "amount": 0
            }
        }
    },
    "errorCode": "0000",
    "message": "操作成功"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» data|object|true|none||none|
|»» biPhaselyBusinessTax|object|true|none||每期營業額預估|
|»»» amount|integer|true|none||none|
|»» annualIncomeTax|object|true|none||應納營所稅預估|
|»»» bookReview|object|true|none||採書審申報|
|»»»» amount|integer|true|none||none|
|»»» documentReview|object|true|none||採查帳申報|
|»»»» amount|integer|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|

# 導入流程/付款流程

## GET 抓取 ET 商品列表

GET /ael/onboarding/payment/getPaymentServiceListForSetup

> Response Examples

> 200 Response

```json
{
    "success": true,
    "data": {
        "yearService": [
            {
                "code": "B002",
                "name": "EasyTax 簡易稅",
                "price": 33600,
                "action": 2,
                "content": "線上記帳+專人報稅，開公司必備。EasyTax 跟會計師事務所合作，全部幫您處理到好，省稅金又安心。",
                "needed": true
            },
            {
                "code": "B004",
                "name": "電子發票系統(年繳）",
                "price": 80000,
                "action": 2,
                "content": "線上開立電子發票，開立完成後會自動入帳，再也不為手開跟折讓煩惱（限 EasyTax 客戶使用）",
                "needed": false
            },
            {
                "code": "B005",
                "name": "開通設定費",
                "price": 2000,
                "action": 0,
                "content": "電子發票系統設定及開通 （如勾選電子發票系統必選）",
                "needed": false
            },
            {
                "code": "B006",
                "name": "電子發票字軌申請",
                "price": 1500,
                "action": 0,
                "content": "財政部電子發票平台帳號開通及申請電子發票字軌 （如勾選電子發票系統必選）",
                "needed": false
            }
        ],
        "monthService": [
            {
                "code": "B001",
                "name": "EasyTax 簡易稅",
                "price": 3000,
                "action": 1,
                "content": "線上記帳+專人報稅，開公司必備。EasyTax 跟會計師事務所合作，全部幫您處理到好，省稅金又安心。",
                "needed": true
            },
            {
                "code": "B003",
                "name": "電子發票系統",
                "price": 650,
                "action": 1,
                "content": "線上開立電子發票，開立完成後會自動入帳，再也不為手開跟折讓煩惱(限 EasyTax 客戶使用)",
                "needed": false
            },
            {
                "code": "B005",
                "name": "開通設定費",
                "price": 2000,
                "action": 0,
                "content": "電子發票系統設定及開通 （如勾選電子發票系統必選）",
                "needed": false
            },
            {
                "code": "B006",
                "name": "電子發票字軌申請",
                "price": 1500,
                "action": 0,
                "content": "財政部電子發票平台帳號開通及申請電子發票字軌 （如勾選電子發票系統必選）",
                "needed": false
            }
        ]
    },
    "errorCode": "0000",
    "message": "操作成功"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET 拿取交易編碼

GET /ael/onboarding/ecpay/merchantCode

拿取交易編碼

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET 抓取待購清單

GET /ael/onboarding/ecpay/productUnpaid

抓取待購清單

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|uuid|query|string| no |user.uuid|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 新增待購清單

POST /ael/onboarding/ecpay/productUnpaid

新增待購清單

> Body Parameters

```json
{
    "userUuid": "580b632a-0ce8-11ef-b75f-42010a8c0002",
    "productIds": [
        "TA005",
        "TA002",
        "TA003",
        "TB002",
        "TB004",
        "TB005",
        "TB006"
    ]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» userUuid|body|string| yes |none|
|» productIds|body|[string]| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PATCH 更新待購清單

PATCH /ael/onboarding/ecpay/productUnpaid

更新待購清單

> Body Parameters

```json
{
    "userUuid": "580b632a-0ce8-11ef-b75f-42010a8c0002",
    "productIds": [
        "TA005",
        "TA002",
        "TA003",
        "TB002",
        "TB004",
        "TB005",
        "TB006"
    ]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» userUuid|body|string| yes |none|
|» productIds|body|[string]| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## DELETE 刪除待購清單

DELETE /ael/onboarding/ecpay/productUnpaid

刪除待購清單

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|uuid|query|string| no |user.uuid|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 建立交易紀錄

POST /ael/onboarding/ecpay/tradeRecord

建立交易紀錄

> Body Parameters

```json
{
    "merchantTradeNo": "RELA2025900017003",
    "tradeNo": "2502271431273218",
    "productId": [
        "B003",
        "B005",
        "B006"
    ],
    "amount": 4150,
    "processDate": "2026/02/24 13:08:28",
    "userUuid": "33a1e264-a96e-49ba-9c47-9e21e2b304b1"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» merchantTradeNo|body|string| yes |我方產的訂單編號|
|» tradeNo|body|string| yes |綠界那邊產的訂單編號|
|» productId|body|[string]| yes |購買品項id列表|
|» amount|body|integer| yes |價錢|
|» processDate|body|string| yes |none|
|» userUuid|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 建立訂閱清單紀錄

POST /ael/onboarding/ecpay/subscriptionList

建立訂閱清單紀錄

> Body Parameters

```json
{
    "userUuid": "33a1e264-a96e-49ba-9c47-9e21e2b304b1",
    "merchantTradeNo": "RELA20261300002"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» userUuid|body|string| yes |none|
|» merchantTradeNo|body|string| yes |我方產的訂單編號|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET 取得本次購買商品清單列表

GET /ael/onboarding/ecpay/shoplist

取得本次購買商品清單列表

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|merchantTradeNo|query|string| no |我方產的訂單編號|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 帳務系統和定期扣款需要呼叫自動開立發票

POST /ael/onboarding/ecpay/automatic/issue/invoice

帳務系統和定期扣款需要呼叫自動開立發票

> Body Parameters

```json
{
    "uuid": "33a1e264-a96e-49ba-9c47-9e21e2b304b1",
    "productName": "EasyTax 簡易稅",
    "price": 33600,
    "merchantTradeNo": "RELS2026100006"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» uuid|body|string| yes |none|
|» productName|body|string| yes |品項名稱|
|» price|body|integer| yes |價錢|
|» merchantTradeNo|body|string| yes |我方產的訂單編號|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 購買電子發票系統時初始化電子發票的用戶資料

POST /ael/onboarding/ecpay/eInvoiceBasicSet

購買電子發票系統時初始化電子發票的用戶資料

> Body Parameters

```json
{
    "userUuid": "c9e7806d-f4d0-11ef-844e-42010a8c0002"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» userUuid|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PATCH 取消訂閱

PATCH /ael/onboarding/ecpay/subscription/cancel

取消訂閱（試用期/正式期皆適用）

> Body Parameters

```json
{
    "userUuid": "c9e7806d-f4d0-11ef-844e-42010a8c0002",
    "productId": "B002"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» userUuid|body|string| yes |none|
|» productId|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 建立或更新（upsert） payment_user

POST /ael/onboarding/ecpay/paymentUser

建立或更新（upsert） payment_user

> Body Parameters

```json
{
  "uuid": "string",
  "companyName": "string",
  "companyTaxId": "string",
  "companyAddr": "string",
  "userName": "string",
  "phone": "string",
  "email": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» uuid|body|string| yes |公司uuid|
|» companyName|body|string| yes |公司名稱|
|» companyTaxId|body|string| yes |公司稅編|
|» companyAddr|body|string| yes |公司地址|
|» userName|body|string| yes |負責人姓名|
|» phone|body|string| yes |負責人電話|
|» email|body|string| yes |負責人Mail|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET 拿取使用者的資料

GET /ael/onboarding/ecpay/paymentUser

拿取使用者的資料

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|uuid|query|string| no |payment_user的uuid|

> Response Examples

> 200 Response

```json
{
  "success": "string",
  "data": {
    "userInfo": {
      "id": 0,
      "userUuid": "string",
      "bindCardId": "string",
      "cardValidYy": "string",
      "cardValidMm": "string",
      "gwsr": 0,
      "createTime": "string",
      "companyName": "string",
      "companyTaxId": "string",
      "companyAddr": "string",
      "userName": "string",
      "phone": "string",
      "email": "string",
      "card4No": "string",
      "card6No": "string"
    },
    "tradeNo": "string"
  },
  "errorCode": "string",
  "message": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|string|true|none||none|
|» data|object|true|none||none|
|»» userInfo|object|true|none||none|
|»»» id|integer|true|none||none|
|»»» userUuid|string|true|none||特店會員編號|
|»»» bindCardId|string|true|none||綁定信用卡代碼|
|»»» cardValidYy|string|true|none||信用卡有效年|
|»»» cardValidMm|string|true|none||信用卡有效月|
|»»» gwsr|integer|true|none||銀行授權碼|
|»»» createTime|string|true|none||創建時間|
|»»» companyName|string|true|none||公司名稱|
|»»» companyTaxId|string|true|none||公司稅編|
|»»» companyAddr|string|true|none||公司地址|
|»»» userName|string|true|none||使用者名稱|
|»»» phone|string|true|none||手機|
|»»» email|string|true|none||信箱|
|»»» card4No|string|true|none||卡號末四碼|
|»»» card6No|string|true|none||卡號前六碼|
|»» tradeNo|string|true|none||none|
|» errorCode|string|true|none||0000|
|» message|string|true|none||操作成功|

## POST 在收到綠界綁卡通知時，更新使用者的資訊

POST /ael/onboarding/ecpay/updatePaymentUseCardInfo

在收到綠界綁卡通知時，更新使用者的資訊

> Body Parameters

```json
{
  "uuid": "string",
  "bindCardId": "string",
  "cardValidYy": "string",
  "cardValidMm": "string",
  "gwsr": 0,
  "card6No": "string",
  "card4No": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» uuid|body|string| yes |payment_user的uuid|
|» bindCardId|body|string| yes |綁定信用卡代碼|
|» cardValidYy|body|string| yes |信用卡有效年|
|» cardValidMm|body|string| yes |信用卡有效月|
|» gwsr|body|integer| yes |銀行授權碼|
|» card6No|body|string| yes |信用卡前六碼|
|» card4No|body|string| yes |信用卡後四碼|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 完成交易後創建accounting_user_account、accounting_user_status_table_phase

POST /ael/onboarding/user/create/behindTrade

完成交易後創建accounting_user_account、accounting_user_status_table_phase

> Body Parameters

```json
{
  "uuid": "string",
  "merchantTradeNo": "string",
  "email": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» uuid|body|string| yes |帳號uuid|
|» merchantTradeNo|body|string| yes |我方產的訂單編號|
|» email|body|string| yes |負責人mail|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 開立帳單

POST /ael/onboarding/cms/bill/autopayment/bill/setup

開立帳單

> Body Parameters

```json
{
    "uuid": "b567fe50-da42-4836-9978-4cd4b3158bb8",
    "merchantTradeNo": "RELA20241700001"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» uuid|body|string| yes |none|
|» merchantTradeNo|body|string| yes |我方產的訂單編號|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# 之後開發/憑證批次辨識

## POST 憑證上傳回傳辨識用 id

POST /api/onboarding/voucher/upload

回傳 voucherId 供後續 SSE 使用

> Body Parameters

```yaml
file: ""

```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» file|body|string(binary)| no |none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "data": {
        "voucherId": 123
    },
    "errorCode": "0000",
    "message": "操作成功"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» data|object|true|none||none|
|»» voucherId|integer|true|none||sse id|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|

## GET AI 辨識 + 費用分類

GET /api/onboarding/voucher/{voucherId}/analyze

SSE 串流，依序回傳 AI 辨識的發票資訊與費用分類建議

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|voucherId|path|string| yes |none|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "data": {
        "voucherType": 1,
        "invoicePrefix": "AB",
        "invoiceNumber": "12345678",
        "date": "115/02/09",
        "sellerTaxId": "87888888",
        "sellerName": "蓬萊飲品有限公司",
        "amount": 30000,
        "tax": 1500,
        "total": 31500
    },
    "errorCode": "0000",
    "message": "操作成功"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|AI 辨識的發票基本資訊，前端收到後立即填入右欄表單欄位|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|true|none||none|
|» data|object|true|none||none|
|»» voucherType|integer|true|none||1: 銷項 2: 進項|
|»» invoicePrefix|string|true|none||字軌|
|»» invoiceNumber|string|true|none||發票號碼|
|»» date|string|true|none||開立日期|
|»» sellerTaxId|string|true|none||賣方統編|
|»» sellerName|string|true|none||賣方名稱|
|»» buyerTaxId|string|true|none||買方名稱|
|»» buyerName|string|true|none||買方名稱|
|»» amount|integer|true|none||銷售額|
|»» tax|integer|true|none||稅額|
|»» total|integer|true|none||總金額|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|

# 會計科目

## GET 撈取最新年份財政部官方會計科目列表

GET /ael/subject/official/list/latest

撈取最新年份財政部官方會計科目列表

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|value|query|string| no |篩選值|

> Response Examples

> 200 Response

```json
{
    "data": [
        {
            "id": 1,
            "year": 114,
            "subjectCode": "0100001",
            "name": "營業收入總額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 2,
            "year": 114,
            "subjectCode": "0100002",
            "name": "減：銷貨退回",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 3,
            "year": 114,
            "subjectCode": "0100003",
            "name": "銷貨折讓",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 4,
            "year": 114,
            "subjectCode": "0100004",
            "name": "營業收入淨額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 5,
            "year": 114,
            "subjectCode": "0100005",
            "name": "營業成本",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 6,
            "year": 114,
            "subjectCode": "0100006",
            "name": "營業毛利",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 7,
            "year": 114,
            "subjectCode": "0100008",
            "name": "營業費用及損失總額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 8,
            "year": 114,
            "subjectCode": "0100010",
            "name": "薪資支出",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 9,
            "year": 114,
            "subjectCode": "0100011",
            "name": "租金支出",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 10,
            "year": 114,
            "subjectCode": "0100012",
            "name": "文具用品",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 11,
            "year": 114,
            "subjectCode": "0100013",
            "name": "旅費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 12,
            "year": 114,
            "subjectCode": "0100014",
            "name": "運費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 13,
            "year": 114,
            "subjectCode": "0100015",
            "name": "郵電費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 14,
            "year": 114,
            "subjectCode": "0100016",
            "name": "修繕費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 15,
            "year": 114,
            "subjectCode": "0100017",
            "name": "廣告費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 16,
            "year": 114,
            "subjectCode": "0100018",
            "name": "水電瓦斯費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 17,
            "year": 114,
            "subjectCode": "0100019",
            "name": "保險費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 18,
            "year": 114,
            "subjectCode": "0100020",
            "name": "交際費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 19,
            "year": 114,
            "subjectCode": "0100021",
            "name": "捐贈",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 20,
            "year": 114,
            "subjectCode": "0100022",
            "name": "稅捐",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 21,
            "year": 114,
            "subjectCode": "0100023",
            "name": "呆帳損失",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 22,
            "year": 114,
            "subjectCode": "0100024",
            "name": "折舊",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 23,
            "year": 114,
            "subjectCode": "0100025",
            "name": "各項耗竭及攤提（包括商譽攤銷）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 24,
            "year": 114,
            "subjectCode": "0100026",
            "name": "外銷損失",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 25,
            "year": 114,
            "subjectCode": "0100027",
            "name": "伙食費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 26,
            "year": 114,
            "subjectCode": "0100028",
            "name": "職工福利",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 27,
            "year": 114,
            "subjectCode": "0100029",
            "name": "研究發展費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 28,
            "year": 114,
            "subjectCode": "0100030",
            "name": "佣金支出",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 29,
            "year": 114,
            "subjectCode": "0100031",
            "name": "訓練費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 30,
            "year": 114,
            "subjectCode": "0100032",
            "name": "其他費用",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 31,
            "year": 114,
            "subjectCode": "0100033",
            "name": "營業淨利",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 32,
            "year": 114,
            "subjectCode": "0100034",
            "name": "非營業收入總額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 33,
            "year": 114,
            "subjectCode": "0100035",
            "name": "投資收益（含權益法之投資收益）及一般股息及紅利（含國外投資收益）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 35,
            "year": 114,
            "subjectCode": "0100036",
            "name": "依所得稅法第42條規定取得之股利或盈餘",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 36,
            "year": 114,
            "subjectCode": "0100038",
            "name": "利息收入",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 37,
            "year": 114,
            "subjectCode": "0100039",
            "name": "租賃收入",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 38,
            "year": 114,
            "subjectCode": "0100040",
            "name": "處分資產利益（包括證券、期貨、土地交易所得)",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 39,
            "year": 114,
            "subjectCode": "0100041",
            "name": "佣金收入",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 40,
            "year": 114,
            "subjectCode": "0100043",
            "name": "兌換盈益",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 41,
            "year": 114,
            "subjectCode": "0100044",
            "name": "其他收入",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 42,
            "year": 114,
            "subjectCode": "0100045",
            "name": "非營業損失及費用總額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 43,
            "year": 114,
            "subjectCode": "0100046",
            "name": "利息支出",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 44,
            "year": 114,
            "subjectCode": "0100047",
            "name": "投資損失",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 45,
            "year": 114,
            "subjectCode": "0100048",
            "name": "處分資產損失（包括證券、期貨、土地交易損失)",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 46,
            "year": 114,
            "subjectCode": "0100049",
            "name": "災害損失",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 47,
            "year": 114,
            "subjectCode": "0100051",
            "name": "兌換虧損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 48,
            "year": 114,
            "subjectCode": "0100052",
            "name": "其他損失",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 49,
            "year": 114,
            "subjectCode": "0100053",
            "name": "全年所得額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 50,
            "year": 114,
            "subjectCode": "0100122",
            "name": "所得稅費用",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 34,
            "year": 114,
            "subjectCode": "0100137",
            "name": "依所得稅法第43條之3規定計算之投資收益",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 51,
            "year": 114,
            "subjectCode": "0201000",
            "name": "資產總額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 52,
            "year": 114,
            "subjectCode": "0201100",
            "name": "流動資產",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 53,
            "year": 114,
            "subjectCode": "0201111",
            "name": "現金",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 54,
            "year": 114,
            "subjectCode": "0201112",
            "name": "銀行存款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 55,
            "year": 114,
            "subjectCode": "0201113",
            "name": "約當現金",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 56,
            "year": 114,
            "subjectCode": "0201114",
            "name": "短期性之投資",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 65,
            "year": 114,
            "subjectCode": "0201121",
            "name": "應收票據",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 66,
            "year": 114,
            "subjectCode": "0201122",
            "name": "減：備抵呆帳",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 67,
            "year": 114,
            "subjectCode": "0201123",
            "name": "應收帳款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 68,
            "year": 114,
            "subjectCode": "0201124",
            "name": "減：備抵呆帳",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 63,
            "year": 114,
            "subjectCode": "0201125",
            "name": "合約資產－流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 64,
            "year": 114,
            "subjectCode": "0201126",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 69,
            "year": 114,
            "subjectCode": "0201129",
            "name": "其他應收款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 70,
            "year": 114,
            "subjectCode": "0201130",
            "name": "存貨",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 71,
            "year": 114,
            "subjectCode": "0201131",
            "name": "商品",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 72,
            "year": 114,
            "subjectCode": "0201132",
            "name": "製成品",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 73,
            "year": 114,
            "subjectCode": "0201133",
            "name": "在製品（或在建工程）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 74,
            "year": 114,
            "subjectCode": "0201134",
            "name": "原料",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 75,
            "year": 114,
            "subjectCode": "0201135",
            "name": "物料",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 76,
            "year": 114,
            "subjectCode": "0201136",
            "name": "寄銷品",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 78,
            "year": 114,
            "subjectCode": "0201137",
            "name": "減：備抵存貨跌價",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 77,
            "year": 114,
            "subjectCode": "0201138",
            "name": "其他",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 79,
            "year": 114,
            "subjectCode": "0201140",
            "name": "預付款項",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 80,
            "year": 114,
            "subjectCode": "0201141",
            "name": "預付費用",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 81,
            "year": 114,
            "subjectCode": "0201142",
            "name": "用品盤存",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 82,
            "year": 114,
            "subjectCode": "0201143",
            "name": "預付貨款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 83,
            "year": 114,
            "subjectCode": "0201144",
            "name": "進項稅款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 84,
            "year": 114,
            "subjectCode": "0201145",
            "name": "留抵稅額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 85,
            "year": 114,
            "subjectCode": "0201149",
            "name": "其他預付款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 57,
            "year": 114,
            "subjectCode": "0201151",
            "name": "透過損益按公允價值衡量之金融資產－流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 58,
            "year": 114,
            "subjectCode": "0201154",
            "name": "避險之金融資產－流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 61,
            "year": 114,
            "subjectCode": "0201157",
            "name": "其他金融資產－流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 59,
            "year": 114,
            "subjectCode": "0201158",
            "name": "透過其他綜合損益按公允價值衡量之金融資產－流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 62,
            "year": 114,
            "subjectCode": "0201159",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 60,
            "year": 114,
            "subjectCode": "0201161",
            "name": "按攤銷後成本衡量之金融資產－流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 86,
            "year": 114,
            "subjectCode": "0201190",
            "name": "其他流動資產",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 87,
            "year": 114,
            "subjectCode": "0201191",
            "name": "暫付款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 88,
            "year": 114,
            "subjectCode": "0201192",
            "name": "業主（股東）往來",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 89,
            "year": 114,
            "subjectCode": "0201193",
            "name": "同業往來",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 90,
            "year": 114,
            "subjectCode": "0201199",
            "name": "其他流動資產－其他",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 91,
            "year": 114,
            "subjectCode": "0201200",
            "name": "非流動資產",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 92,
            "year": 114,
            "subjectCode": "0201300",
            "name": "長期性之投資",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 93,
            "year": 114,
            "subjectCode": "0201302",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 103,
            "year": 114,
            "subjectCode": "0201400",
            "name": "不動產、廠房及設備（固定資產）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 104,
            "year": 114,
            "subjectCode": "0201410",
            "name": "土地",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 105,
            "year": 114,
            "subjectCode": "0201411",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 125,
            "year": 114,
            "subjectCode": "0201421",
            "name": "礦產資源",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 126,
            "year": 114,
            "subjectCode": "0201422",
            "name": "減：累計折耗",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 127,
            "year": 114,
            "subjectCode": "0201423",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 106,
            "year": 114,
            "subjectCode": "0201431",
            "name": "房屋及建築",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 107,
            "year": 114,
            "subjectCode": "0201432",
            "name": "減：累計折舊",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 108,
            "year": 114,
            "subjectCode": "0201433",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 109,
            "year": 114,
            "subjectCode": "0201441",
            "name": "機器設備",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 110,
            "year": 114,
            "subjectCode": "0201442",
            "name": "減：累計折舊",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 111,
            "year": 114,
            "subjectCode": "0201443",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 112,
            "year": 114,
            "subjectCode": "0201451",
            "name": "運輸設備",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 113,
            "year": 114,
            "subjectCode": "0201452",
            "name": "減：累計折舊",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 114,
            "year": 114,
            "subjectCode": "0201453",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 115,
            "year": 114,
            "subjectCode": "0201461",
            "name": "辦公設備",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 116,
            "year": 114,
            "subjectCode": "0201462",
            "name": "減：累計折舊",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 117,
            "year": 114,
            "subjectCode": "0201463",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 118,
            "year": 114,
            "subjectCode": "0201470",
            "name": "未完工程及待驗設備",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 119,
            "year": 114,
            "subjectCode": "0201491",
            "name": "其他固定資產",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 120,
            "year": 114,
            "subjectCode": "0201492",
            "name": "減：累計折舊",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 121,
            "year": 114,
            "subjectCode": "0201493",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 131,
            "year": 114,
            "subjectCode": "0201510",
            "name": "無形資產(包括商譽金額 元)",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 132,
            "year": 114,
            "subjectCode": "0201511",
            "name": "減：累計攤折",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 133,
            "year": 114,
            "subjectCode": "0201512",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 122,
            "year": 114,
            "subjectCode": "0201541",
            "name": "投資性不動產",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 123,
            "year": 114,
            "subjectCode": "0201542",
            "name": "減：累計折舊",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 124,
            "year": 114,
            "subjectCode": "0201543",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 128,
            "year": 114,
            "subjectCode": "0201551",
            "name": "生物資產",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 129,
            "year": 114,
            "subjectCode": "0201552",
            "name": "減：累計折舊",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 130,
            "year": 114,
            "subjectCode": "0201553",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 94,
            "year": 114,
            "subjectCode": "0201612",
            "name": "透過損益按公允價值衡量之金融資產－非流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 95,
            "year": 114,
            "subjectCode": "0201615",
            "name": "避險之金融資產－非流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 98,
            "year": 114,
            "subjectCode": "0201618",
            "name": "其他金融資產－非流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 96,
            "year": 114,
            "subjectCode": "0201621",
            "name": "透過其他綜合損益按公允價值衡量之金融資產－非流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 97,
            "year": 114,
            "subjectCode": "0201622",
            "name": "按攤銷後成本衡量之金融資產－非流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 99,
            "year": 114,
            "subjectCode": "0201630",
            "name": "採用權益法之投資",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 100,
            "year": 114,
            "subjectCode": "0201631",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 101,
            "year": 114,
            "subjectCode": "0201640",
            "name": "合約資產－非流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 102,
            "year": 114,
            "subjectCode": "0201641",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 134,
            "year": 114,
            "subjectCode": "0201710",
            "name": "使用權資產",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 135,
            "year": 114,
            "subjectCode": "0201711",
            "name": "減：累計折舊",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 136,
            "year": 114,
            "subjectCode": "0201712",
            "name": "減：累計減損",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 137,
            "year": 114,
            "subjectCode": "0201900",
            "name": "其他非流動資產",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 138,
            "year": 114,
            "subjectCode": "0201901",
            "name": "存出保證金",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 139,
            "year": 114,
            "subjectCode": "0201902",
            "name": "未攤銷費用",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 140,
            "year": 114,
            "subjectCode": "0201903",
            "name": "預付設備款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 141,
            "year": 114,
            "subjectCode": "0201904",
            "name": "其他非流動資產－其他",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 142,
            "year": 114,
            "subjectCode": "0202000",
            "name": "負債總額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 143,
            "year": 114,
            "subjectCode": "0202100",
            "name": "流動負債",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 144,
            "year": 114,
            "subjectCode": "0202110",
            "name": "短期借款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 145,
            "year": 114,
            "subjectCode": "0202111",
            "name": "銀行透支",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 146,
            "year": 114,
            "subjectCode": "0202112",
            "name": "銀行借款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 147,
            "year": 114,
            "subjectCode": "0202113",
            "name": "應付短期票券",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 148,
            "year": 114,
            "subjectCode": "0202119",
            "name": "其他短期借款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 154,
            "year": 114,
            "subjectCode": "0202120",
            "name": "應付票據",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 155,
            "year": 114,
            "subjectCode": "0202121",
            "name": "應付帳款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 153,
            "year": 114,
            "subjectCode": "0202126",
            "name": "合約負債－流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 156,
            "year": 114,
            "subjectCode": "0202130",
            "name": "其他應付款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 157,
            "year": 114,
            "subjectCode": "0202131",
            "name": "應付費用",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 158,
            "year": 114,
            "subjectCode": "0202132",
            "name": "應付稅捐",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 159,
            "year": 114,
            "subjectCode": "0202133",
            "name": "應付股利",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 160,
            "year": 114,
            "subjectCode": "0202134",
            "name": "銷項稅額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 161,
            "year": 114,
            "subjectCode": "0202135",
            "name": "其他應付款－其他",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 162,
            "year": 114,
            "subjectCode": "0202136",
            "name": "預收款項",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 163,
            "year": 114,
            "subjectCode": "0202137",
            "name": "預收貨款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 164,
            "year": 114,
            "subjectCode": "0202138",
            "name": "其他預收款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 149,
            "year": 114,
            "subjectCode": "0202140",
            "name": "透過損益按公允價值衡量之金融負債－流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 150,
            "year": 114,
            "subjectCode": "0202150",
            "name": "避險之金融負債－流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 151,
            "year": 114,
            "subjectCode": "0202170",
            "name": "特別股負債－流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 152,
            "year": 114,
            "subjectCode": "0202180",
            "name": "其他金融負債－流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 165,
            "year": 114,
            "subjectCode": "0202190",
            "name": "其他流動負債",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 166,
            "year": 114,
            "subjectCode": "0202191",
            "name": "暫收款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 167,
            "year": 114,
            "subjectCode": "0202192",
            "name": "業主（股東）往來",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 168,
            "year": 114,
            "subjectCode": "0202193",
            "name": "同業往來",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 169,
            "year": 114,
            "subjectCode": "0202195",
            "name": "代收款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 170,
            "year": 114,
            "subjectCode": "0202196",
            "name": "其他流動負債－其他",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 171,
            "year": 114,
            "subjectCode": "0202200",
            "name": "非流動負債",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 172,
            "year": 114,
            "subjectCode": "0202210",
            "name": "應付公司債",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 173,
            "year": 114,
            "subjectCode": "0202220",
            "name": "長期借款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 174,
            "year": 114,
            "subjectCode": "0202230",
            "name": "透過損益按公允價值衡量之金融負債－非流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 175,
            "year": 114,
            "subjectCode": "0202240",
            "name": "避險之金融負債－非流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 176,
            "year": 114,
            "subjectCode": "0202260",
            "name": "特別股負債－非流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 177,
            "year": 114,
            "subjectCode": "0202270",
            "name": "其他金融負債－非流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 178,
            "year": 114,
            "subjectCode": "0202280",
            "name": "長期應付票據及款項",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 179,
            "year": 114,
            "subjectCode": "0202281",
            "name": "合約負債－非流動",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 180,
            "year": 114,
            "subjectCode": "0202282",
            "name": "租賃負債",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 181,
            "year": 114,
            "subjectCode": "0202290",
            "name": "其他長期負債",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 182,
            "year": 114,
            "subjectCode": "0202900",
            "name": "其他非流動負債",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 183,
            "year": 114,
            "subjectCode": "0202910",
            "name": "存入保證金",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 184,
            "year": 114,
            "subjectCode": "0202940",
            "name": "退休金準備",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 185,
            "year": 114,
            "subjectCode": "0202951",
            "name": "國外投資損失準備",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 186,
            "year": 114,
            "subjectCode": "0202970",
            "name": "受託承銷品",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 187,
            "year": 114,
            "subjectCode": "0202999",
            "name": "其他非流動負債－其他",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 188,
            "year": 114,
            "subjectCode": "0203000",
            "name": "權益總額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 189,
            "year": 114,
            "subjectCode": "0203100",
            "name": "資本或股本（實收）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 190,
            "year": 114,
            "subjectCode": "0203110",
            "name": "股本（登記）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 192,
            "year": 114,
            "subjectCode": "0203120",
            "name": "減：未發行股本",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 191,
            "year": 114,
            "subjectCode": "0203130",
            "name": "加：預收股款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 193,
            "year": 114,
            "subjectCode": "0203300",
            "name": "資本公積",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 194,
            "year": 114,
            "subjectCode": "0203400",
            "name": "保留盈餘",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 195,
            "year": 114,
            "subjectCode": "0203410",
            "name": "法定盈餘公積",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 196,
            "year": 114,
            "subjectCode": "0203411",
            "name": "法定盈餘公積（86年度以前餘額)",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 197,
            "year": 114,
            "subjectCode": "0203412",
            "name": "法定盈餘公積（87年度以後餘額)",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 198,
            "year": 114,
            "subjectCode": "0203420",
            "name": "特別盈餘公積",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 199,
            "year": 114,
            "subjectCode": "0203421",
            "name": "特別盈餘公積（86年度以前餘額)",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 200,
            "year": 114,
            "subjectCode": "0203422",
            "name": "特別盈餘公積（87年度以後餘額)",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 201,
            "year": 114,
            "subjectCode": "0203430",
            "name": "累積盈虧",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 202,
            "year": 114,
            "subjectCode": "0203431",
            "name": "累積盈虧（86年度以前餘額)",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 203,
            "year": 114,
            "subjectCode": "0203432",
            "name": "累積盈虧（87年度以後餘額)",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 204,
            "year": 114,
            "subjectCode": "0203434",
            "name": "追溯適用及追溯重編之影響數",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 205,
            "year": 114,
            "subjectCode": "0203435",
            "name": "本期自其他綜合損益或其他權益項目轉入之稅後淨額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 206,
            "year": 114,
            "subjectCode": "0203440",
            "name": "本期損益（稅後)",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 207,
            "year": 114,
            "subjectCode": "0203450",
            "name": "減：自本期盈餘分配、撥補虧損及提列法定(特別)盈餘公積之合計金額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 208,
            "year": 114,
            "subjectCode": "0203500",
            "name": "其他權益",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 209,
            "year": 114,
            "subjectCode": "0203502",
            "name": "避險工具之損益",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 210,
            "year": 114,
            "subjectCode": "0203503",
            "name": "國外營運機構財務報表換算之兌換差額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 211,
            "year": 114,
            "subjectCode": "0203504",
            "name": "未實現重估增值",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 212,
            "year": 114,
            "subjectCode": "0203505",
            "name": "確定福利計畫再衡量數",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 215,
            "year": 114,
            "subjectCode": "0203506",
            "name": "其他權益－其他",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 213,
            "year": 114,
            "subjectCode": "0203507",
            "name": "透過其他綜合損益按公允價值衡量之未實現損益",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 214,
            "year": 114,
            "subjectCode": "0203508",
            "name": "員工未賺得酬勞",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 216,
            "year": 114,
            "subjectCode": "0203600",
            "name": "減：庫藏股票",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 217,
            "year": 114,
            "subjectCode": "0209000",
            "name": "負債及權益總額",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 218,
            "year": 114,
            "subjectCode": "0300001",
            "name": "期初存貨",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 219,
            "year": 114,
            "subjectCode": "0300002",
            "name": "本期進貨（淨額）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 223,
            "year": 114,
            "subjectCode": "0300009",
            "name": "進銷成本",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 224,
            "year": 114,
            "subjectCode": "0300010",
            "name": "期初存料",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 225,
            "year": 114,
            "subjectCode": "0300011",
            "name": "本期進料（淨額）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 229,
            "year": 114,
            "subjectCode": "0300013",
            "name": "直接原料",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 230,
            "year": 114,
            "subjectCode": "0300014",
            "name": "期初存料",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 231,
            "year": 114,
            "subjectCode": "0300015",
            "name": "本期進料（淨額）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 235,
            "year": 114,
            "subjectCode": "0300017",
            "name": "間接材料",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 236,
            "year": 114,
            "subjectCode": "0300018",
            "name": "直接人工",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 237,
            "year": 114,
            "subjectCode": "0300019",
            "name": "製造費用",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 238,
            "year": 114,
            "subjectCode": "0300020",
            "name": "製造成本",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 239,
            "year": 114,
            "subjectCode": "0300021",
            "name": "期初在製品存貨",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 243,
            "year": 114,
            "subjectCode": "0300030",
            "name": "製成品成本",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 244,
            "year": 114,
            "subjectCode": "0300031",
            "name": "期初製成品存貨",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 248,
            "year": 114,
            "subjectCode": "0300033",
            "name": "外銷估列應收退稅或已收退稅款",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 249,
            "year": 114,
            "subjectCode": "0300040",
            "name": "產銷成本減項",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 250,
            "year": 114,
            "subjectCode": "0300050",
            "name": "產銷成本",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 251,
            "year": 114,
            "subjectCode": "0300060",
            "name": "勞務成本",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 252,
            "year": 114,
            "subjectCode": "0300070",
            "name": "修理成本",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 253,
            "year": 114,
            "subjectCode": "0300080",
            "name": "加工成本",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 254,
            "year": 114,
            "subjectCode": "0300081",
            "name": "業務成本",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 255,
            "year": 114,
            "subjectCode": "0300085",
            "name": "其他營業成本",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 256,
            "year": 114,
            "subjectCode": "0300090",
            "name": "營業成本",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 220,
            "year": 114,
            "subjectCode": "0300301",
            "name": "期末存貨",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 221,
            "year": 114,
            "subjectCode": "0300302",
            "name": "加：其他",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 222,
            "year": 114,
            "subjectCode": "0300303",
            "name": "減：其他",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 226,
            "year": 114,
            "subjectCode": "0301201",
            "name": "期末存料",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 227,
            "year": 114,
            "subjectCode": "0301202",
            "name": "加：其他（              ）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 228,
            "year": 114,
            "subjectCode": "0301203",
            "name": "減：其他（              ）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 232,
            "year": 114,
            "subjectCode": "0301601",
            "name": "期末存料",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 233,
            "year": 114,
            "subjectCode": "0301602",
            "name": "加：其他（              ）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 234,
            "year": 114,
            "subjectCode": "0301603",
            "name": "減：其他（              ）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 240,
            "year": 114,
            "subjectCode": "0302201",
            "name": "期末在製品存貨",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 241,
            "year": 114,
            "subjectCode": "0302202",
            "name": "加：其他（              ）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 242,
            "year": 114,
            "subjectCode": "0302203",
            "name": "減：其他（              ）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 245,
            "year": 114,
            "subjectCode": "0303201",
            "name": "期末製成品存貨",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 246,
            "year": 114,
            "subjectCode": "0303202",
            "name": "加：其他（              ）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 247,
            "year": 114,
            "subjectCode": "0303203",
            "name": "減：其他（              ）",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 257,
            "year": 114,
            "subjectCode": "04B0001",
            "name": "間接人工",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 258,
            "year": 114,
            "subjectCode": "04B0002",
            "name": "租金支出",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 259,
            "year": 114,
            "subjectCode": "04B0003",
            "name": "文具用品",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 260,
            "year": 114,
            "subjectCode": "04B0004",
            "name": "旅費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 261,
            "year": 114,
            "subjectCode": "04B0005",
            "name": "運費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 262,
            "year": 114,
            "subjectCode": "04B0006",
            "name": "郵電費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 263,
            "year": 114,
            "subjectCode": "04B0007",
            "name": "修繕費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 264,
            "year": 114,
            "subjectCode": "04B0008",
            "name": "包裝費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 265,
            "year": 114,
            "subjectCode": "04B0009",
            "name": "水電瓦斯費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 266,
            "year": 114,
            "subjectCode": "04B0010",
            "name": "保險費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 267,
            "year": 114,
            "subjectCode": "04B0011",
            "name": "加工費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 268,
            "year": 114,
            "subjectCode": "04B0012",
            "name": "稅捐",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 269,
            "year": 114,
            "subjectCode": "04B0013",
            "name": "折舊",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 270,
            "year": 114,
            "subjectCode": "04B0014",
            "name": "各項耗竭及攤提",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 271,
            "year": 114,
            "subjectCode": "04B0015",
            "name": "伙食費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 272,
            "year": 114,
            "subjectCode": "04B0016",
            "name": "職工福利",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 273,
            "year": 114,
            "subjectCode": "04B0090",
            "name": "其他製造費用",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 274,
            "year": 114,
            "subjectCode": "05C2901",
            "name": "耗材費用",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 275,
            "year": 114,
            "subjectCode": "05C2902",
            "name": "薪資費用",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 276,
            "year": 114,
            "subjectCode": "05C2903",
            "name": "租金支出",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 277,
            "year": 114,
            "subjectCode": "05C2904",
            "name": "文具用品",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 278,
            "year": 114,
            "subjectCode": "05C2905",
            "name": "旅費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 279,
            "year": 114,
            "subjectCode": "05C2906",
            "name": "運費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 280,
            "year": 114,
            "subjectCode": "05C2907",
            "name": "郵電費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 281,
            "year": 114,
            "subjectCode": "05C2908",
            "name": "修繕費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 282,
            "year": 114,
            "subjectCode": "05C2909",
            "name": "水電瓦斯費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 283,
            "year": 114,
            "subjectCode": "05C2910",
            "name": "保險費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 284,
            "year": 114,
            "subjectCode": "05C2911",
            "name": "交際費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 285,
            "year": 114,
            "subjectCode": "05C2912",
            "name": "稅捐",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 286,
            "year": 114,
            "subjectCode": "05C2913",
            "name": "折舊",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 287,
            "year": 114,
            "subjectCode": "05C2914",
            "name": "各項耗竭及攤提",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 288,
            "year": 114,
            "subjectCode": "05C2915",
            "name": "伙食費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 289,
            "year": 114,
            "subjectCode": "05C2916",
            "name": "職工福利",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 290,
            "year": 114,
            "subjectCode": "05C2917",
            "name": "權利金",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 291,
            "year": 114,
            "subjectCode": "05C2918",
            "name": "勞務費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 292,
            "year": 114,
            "subjectCode": "05C2919",
            "name": "訓練費",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        },
        {
            "id": 293,
            "year": 114,
            "subjectCode": "05C2920",
            "name": "其他研究發展費用",
            "debitCreditType": null,
            "remark": null,
            "createdAt": "2026-06-10T17:17:52Z",
            "updatedAt": "2026-06-10T17:17:52Z"
        }
    ],
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[object]|true|none||none|
|»» id|integer|true|none||none|
|»» year|integer|true|none||none|
|»» subjectCode|string|true|none||none|
|»» name|string|true|none||none|
|»» debitCreditType|null|true|none||none|
|»» remark|null|true|none||none|
|»» createdAt|string|true|none||none|
|»» updatedAt|string|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## GET 撈取某公司的常用會計科目排行

GET /ael/subject/usage

撈取某公司的常用會計科目排行（使用次數前 20 名，由高至低）

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|acUuid|query|string| no |公司uuid|
|value|query|string| no |篩選值|

> Response Examples

> 200 Response

```json
{
    "data": [
        {
            "acUuid": "5e0572c3-3859-4dd6-81cb-64ad30ad6221",
            "createTime": "2026-06-16T09:21:36Z",
            "rank": 1,
            "subjectName": "薪資支出",
            "updateTime": "2026-06-16T09:23:10Z",
            "useCount": 3
        },
        {
            "acUuid": "5e0572c3-3859-4dd6-81cb-64ad30ad6221",
            "createTime": "2026-06-16T09:33:11Z",
            "rank": 2,
            "subjectName": "稅捐",
            "updateTime": "2026-06-16T09:33:29Z",
            "useCount": 2
        },
        {
            "acUuid": "5e0572c3-3859-4dd6-81cb-64ad30ad6221",
            "createTime": "2026-06-16T09:26:02Z",
            "rank": 3,
            "subjectName": "文具用品",
            "updateTime": "2026-06-16T09:26:02Z",
            "useCount": 1
        },
        {
            "acUuid": "5e0572c3-3859-4dd6-81cb-64ad30ad6221",
            "createTime": "2026-06-16T09:26:07Z",
            "rank": 4,
            "subjectName": "旅費",
            "updateTime": "2026-06-16T09:26:07Z",
            "useCount": 1
        },
        {
            "acUuid": "5e0572c3-3859-4dd6-81cb-64ad30ad6221",
            "createTime": "2026-06-16T09:24:24Z",
            "rank": 5,
            "subjectName": "租金支出",
            "updateTime": "2026-06-16T09:24:24Z",
            "useCount": 1
        }
    ],
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[object]|true|none||none|
|»» acUuid|string|true|none||none|
|»» createTime|string|true|none||none|
|»» rank|integer|true|none||none|
|»» subjectName|string|true|none||none|
|»» updateTime|string|true|none||none|
|»» useCount|integer|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## POST 補充：增加公司該會計科目的使用次數 

POST /ael/subject/usage

依官方會計科目 id 取名稱，並將該公司對該科目名稱的使用次數 +1

> Body Parameters

```json
{
    "acUuid": "5e0572c3-3859-4dd6-81cb-64ad30ad6221",
    "officialSubjectId": 8
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» acUuid|body|string| yes |公司uuid|
|» officialSubjectId|body|integer| yes |官方會計科目id|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# 帳簿

## GET 產生一組帳簿交易編號

GET /ael/ledger/code

產生一組帳簿交易編號

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|acUuid|query|string| no |none|
|date|query|string| no |YYYYMMDD|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# 帳簿/交易

## POST 建立進項應付交易紀錄

POST /ael/ledger/payables

建立進項應付交易紀錄

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "datetime": "20260803",
    "entryDate": "",
    "totalAmount": 210,
    "netAmount": 200,
    "taxAmount": 10,
    "taxFreeAmount": 0,
    "counterpartyName": "和興商店",
    "counterpartyType": 0,
    "officialAccountingSubjectId": 10,
    "counterpartyUuid": "301b53f8-1b59-4ecc-8836-ba6673e6baa7",
    "memo": "",
    "invoiceNum": "AB12345678",
    "invoiceDate": "20260803",
    "voucherKind": 1,
    "ifDebit": true,
    "deductible": true,
    "remark": "測試",
    "summary": "",
    "counterpartyTaxId": "61194605"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司 UUID|
|» datetime|body|string| yes |交易發生日 YYYYMMDD；查固定科目用民國年=YYYY−1911−1；寫入 transaction_date|
|» entryDate|body|string| yes |交易付款日 YYYYMMDD → ledger_entries.entry_date|
|» totalAmount|body|number| yes |含稅總額|
|» netAmount|body|number| yes |未稅|
|» taxAmount|body|number| yes |稅額|
|» taxFreeAmount|body|number| no |免稅銷售額；選填，未傳當 0|
|» counterpartyName|body|string| yes |交易對象名稱|
|» counterpartyType|body|integer| yes |0:廠商B2B，1:個人B2C|
|» officialAccountingSubjectId|body|integer| yes |官方科目 id（進貨／費用科目）|
|» counterpartyUuid|body|string| no |廠商 uuid；僅 counterpartyType=0 可帶，選填|
|» memo|body|string| no |備註；選填|
|» invoiceNum|body|string| no |完整號碼；統一發票可為「字軌+號碼」；voucherKind≠4 時必填|
|» invoiceDate|body|string| yes |發票日 YYYYMMDD|
|» voucherKind|body|integer| yes |進項：0收據 1統一發票 2交通 3水電 4進口|
|» deductible|body|boolean| no |可否扣抵；選填，未傳當可扣抵|
|» remark|body|string| no |發票備註|
|» summary|body|string| no |摘要|
|» counterpartyTaxId|body|string| no |賣方統編；選填|
|» isReturnGoods|body|boolean| no |是否退貨（進口等場景）|
|» importTaxNumber|body|string| no |進口專用：海關代徵營業稅繳納證號碼|
|» others|body|integer| no |進口專用：其他零總稅費加總（進口稅／推廣貿易服務稅以外）|
|» unreportedReason|body|string| no |未申報／不可扣抵原因|
|» alphabeticLetter|body|string| no |字軌；有值時 invoiceNum 當純號碼|

#### Enum

|Name|Value|
|---|---|
|» counterpartyType|0|
|» counterpartyType|1|
|» voucherKind|0|
|» voucherKind|1|
|» voucherKind|2|
|» voucherKind|3|
|» voucherKind|4|

> Response Examples

> 200 Response

```json
{
    "data": {
        "ledgerEntryUuid": "59cca9cc-c794-48fd-96df-7bfabc28a58f",
        "orderCode": "TX-115080300001",
        "invoiceUuid": "e05b68e2-bb25-4905-af7b-9dafbea378c6",
        "autoSettled": false
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

> 400 Response

```json
{
    "success": false,
    "data": null,
    "errorCode": "0005",
    "message": "營所稅申報期間已結束，不可建立非當年度進項交易/不可建立已關閉年度之進項交易/交易日期年度無效"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» ledgerEntryUuid|string|true|none||none|
|»» orderCode|string|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## POST 建立銷項應收交易紀錄

POST /ael/ledger/receivables

建立銷項應收交易紀錄

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "datetime": "20260803",
    "entryDate": "",
    "totalAmount": 1050,
    "netAmount": 1000,
    "taxAmount": 50,
    "taxFreeAmount": 0,
    "counterpartyName": "原味商行",
    "counterpartyType": 0,
    "officialAccountingSubjectId": 41,
    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
    "memo": "選填",
    "invoiceNum": "AB12345679",
    "invoiceDate": "20260803",
    "voucherKind": 1,
    "ifDebit": true,
    "deductible": true,
    "remark": "測試",
    "summary": "",
    "counterpartyTaxId": "38965019"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司 UUID|
|» datetime|body|string| yes |交易發生日 YYYYMMDD；查固定科目用民國年=YYYY−1911−1；寫入 transaction_date|
|» entryDate|body|string| yes |交易收款日 YYYYMMDD → ledger_entries.entry_date|
|» totalAmount|body|number| yes |含稅總額|
|» netAmount|body|number| yes |未稅|
|» taxAmount|body|number| yes |稅額|
|» taxFreeAmount|body|number| no |免稅銷售額；選填，未傳當 0|
|» counterpartyName|body|string| yes |交易對象名稱|
|» counterpartyType|body|integer| yes |0:廠商B2B，1:個人B2C|
|» officialAccountingSubjectId|body|integer| yes |官方科目 id（收入科目）|
|» paymentChannelUuid|body|string| no |銷售管道 uuid；選填，須屬該公司且啟用|
|» counterpartyUuid|body|string| no |廠商 uuid；僅 counterpartyType=0 可帶，選填|
|» memo|body|string| no |備註；選填|
|» invoiceNum|body|string| yes |字軌後的號碼|
|» invoiceDate|body|string| yes |發票日 YYYYMMDD|
|» voucherKind|body|integer| yes |銷項憑證類型；實務可傳 1（統一發票）|
|» deductible|body|boolean| no |可否扣抵；選填|
|» remark|body|string| no |發票備註|
|» summary|body|string| no |摘要|
|» counterpartyTaxId|body|string| no |買方統編；選填|
|» isReturnGoods|body|boolean| no |是否退貨|
|» importTaxNumber|body|string| no |進口專用欄位（銷項通常不用）|
|» others|body|integer| no |進口專用其他稅費加總（銷項通常 0）|
|» unreportedReason|body|string| no |未申報／不可扣抵原因|
|» alphabeticLetter|body|string| no |字軌；有值時 invoiceNum 當純號碼|

#### Enum

|Name|Value|
|---|---|
|» counterpartyType|0|
|» counterpartyType|1|
|» voucherKind|0|
|» voucherKind|1|
|» voucherKind|2|
|» voucherKind|3|
|» voucherKind|4|

> Response Examples

> 200 Response

```json
{
    "data": {
        "ledgerEntryUuid": "f2cb960e-6aac-4b85-8ae6-3133ae86b9f4",
        "orderCode": "TX-115080300003",
        "invoiceUuid": "59ec64ef-c8bc-4996-bda0-eb3a4a0a21b0",
        "autoSettled": false
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 應付帳款列表篩選

POST /ael/ledger/payables/filter

應付帳款列表篩選

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "dateFrom": "20260619",
    "dateTo": "20260729",
    "amountFrom": 50,
    "amountTo": 10000,
    "limit": 10,
    "page": 1
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |none|
|» dateFrom|body|string| no |日期起，YYYYMMDD|
|» dateTo|body|string| no |日期迄，YYYYMMDD|
|» amountFrom|body|integer| no |金額下限|
|» amountTo|body|integer| no |金額上限|
|» limit|body|integer| yes |一頁筆數|
|» page|body|integer| yes |頁碼|
|» filterType|body|integer| no |0 交易編號、1 發票號碼；兩者皆空＝不篩；必須和filterValue一起傳，只傳一邊 → 400|
|» filterValue|body|string| no |篩選值|

> Response Examples

> 200 Response

```json
{
    "data": {
        "items": [
            {
                "ledgerUuid": "8e05c193-e3e3-41a1-91b0-e38ad6e833ca",
                "orderCode": "TX-115073000005",
                "entryDate": "2026-02-05T00:00:00Z",
                "issueDate": "1150201",
                "entryType": 0,
                "entryKind": 0,
                "direction": 3,
                "status": 1,
                "counterpartyName": "測試廠商",
                "counterpartyType": 1,
                "counterpartyUuid": null,
                "totalAmount": 1050,
                "netAmount": 1000,
                "taxAmount": 50,
                "taxFreeAmount": 0,
                "settledAmount": 100,
                "remainingAmount": 950,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 10,
                "subjectName": "文具用品",
                "memo": null,
                "createdAt": "2026-07-30T10:25:56Z",
                "invoice": {
                    "uuid": "160b87d0-6670-457e-9b28-efc1cb790aa1",
                    "invoiceTrack": "AB",
                    "invoiceNumber": "12345678",
                    "date": "1150201",
                    "amount": 1050,
                    "businessTax": 50,
                    "buyOrSell": 2,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": ""
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "e94b8d25-d764-42aa-9e43-c8587f8fc220",
                "orderCode": "TX-115073100007",
                "entryDate": null,
                "issueDate": "1150726",
                "entryType": 0,
                "entryKind": 0,
                "direction": 3,
                "status": 1,
                "counterpartyName": "潤智教育有限公司",
                "counterpartyType": 0,
                "counterpartyUuid": null,
                "totalAmount": 3330,
                "netAmount": 3330,
                "taxAmount": 0,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 3330,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 1,
                "subjectName": "營業收入總額",
                "memo": null,
                "createdAt": "2026-07-31T08:44:23Z",
                "invoice": {
                    "uuid": "7a07bd5f-b3f9-4fe4-be96-d2885a45a637",
                    "invoiceTrack": "WE",
                    "invoiceNumber": "90343000",
                    "date": "1150726",
                    "amount": 3330,
                    "businessTax": 0,
                    "buyOrSell": 2,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": "95441885"
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "c901007d-4ce8-4763-bc56-ce017723a7df",
                "orderCode": "TX-115080600010",
                "entryDate": null,
                "issueDate": "1150806",
                "entryType": 0,
                "entryKind": 0,
                "direction": 3,
                "status": 1,
                "counterpartyName": "原味商行",
                "counterpartyType": 0,
                "counterpartyUuid": null,
                "totalAmount": 500,
                "netAmount": 500,
                "taxAmount": 0,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 500,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 10,
                "subjectName": "文具用品",
                "memo": null,
                "createdAt": "2026-08-06T09:19:15Z",
                "invoice": {
                    "uuid": "20c8a59b-4ada-4281-a807-0adc272cbea1",
                    "invoiceTrack": "TX",
                    "invoiceNumber": "99900010",
                    "date": "1150806",
                    "amount": 500,
                    "businessTax": 0,
                    "buyOrSell": 2,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": "38965019"
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "e11c2c7c-e794-481c-9ff3-f43e80e83b21",
                "orderCode": "TX-115080700001",
                "entryDate": null,
                "issueDate": "1150807",
                "entryType": 0,
                "entryKind": 0,
                "direction": 3,
                "status": 1,
                "counterpartyName": "測試廠商A",
                "counterpartyType": 1,
                "counterpartyUuid": null,
                "totalAmount": 10000,
                "netAmount": 10000,
                "taxAmount": 0,
                "taxFreeAmount": 0,
                "settledAmount": 6000,
                "remainingAmount": 4000,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 10,
                "subjectName": "文具用品",
                "memo": null,
                "createdAt": "2026-08-07T01:57:29Z",
                "invoice": {
                    "uuid": "45842ed4-ee54-4051-8927-a2621c556771",
                    "invoiceTrack": "AB",
                    "invoiceNumber": "12345671",
                    "date": "1150807",
                    "amount": 10000,
                    "businessTax": 0,
                    "buyOrSell": 2,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": ""
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "faa2a200-ccce-45da-8447-9dbd91983403",
                "orderCode": "TX-115080700002",
                "entryDate": null,
                "issueDate": "1150807",
                "entryType": 0,
                "entryKind": 0,
                "direction": 3,
                "status": 1,
                "counterpartyName": "測試廠商A",
                "counterpartyType": 1,
                "counterpartyUuid": null,
                "totalAmount": 5000,
                "netAmount": 5000,
                "taxAmount": 0,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 5000,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 10,
                "subjectName": "文具用品",
                "memo": null,
                "createdAt": "2026-08-07T01:58:24Z",
                "invoice": {
                    "uuid": "9c40eea3-fe63-4917-b1a5-dadfaf969dc7",
                    "invoiceTrack": "AB",
                    "invoiceNumber": "12345672",
                    "date": "1150807",
                    "amount": 5000,
                    "businessTax": 0,
                    "buyOrSell": 2,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": ""
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "17c9ea4e-53d4-416c-ba4f-35b7da09008d",
                "orderCode": "TX-115080700020",
                "entryDate": null,
                "issueDate": "1150807",
                "entryType": 0,
                "entryKind": 0,
                "direction": 3,
                "status": 1,
                "counterpartyName": "和興商店",
                "counterpartyType": 0,
                "counterpartyUuid": "301b53f8-1b59-4ecc-8836-ba6673e6baa7",
                "totalAmount": 630,
                "netAmount": 600,
                "taxAmount": 30,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 630,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 10,
                "subjectName": "文具用品",
                "memo": "測試手動沖帳reverse",
                "createdAt": "2026-08-07T04:24:28Z",
                "invoice": {
                    "uuid": "60aa56cb-00e0-461e-8fa0-e645ecb0b26e",
                    "invoiceTrack": "AB",
                    "invoiceNumber": "98765432",
                    "date": "1150807",
                    "amount": 630,
                    "businessTax": 30,
                    "buyOrSell": 2,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": "61194605"
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "34076495-9edb-4c06-964f-ecd635187bf5",
                "orderCode": "TX-115080700022",
                "entryDate": null,
                "issueDate": "1150807",
                "entryType": 0,
                "entryKind": 0,
                "direction": 3,
                "status": 1,
                "counterpartyName": "測試廠商四",
                "counterpartyType": 1,
                "counterpartyUuid": null,
                "totalAmount": 840,
                "netAmount": 800,
                "taxAmount": 40,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 840,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 10,
                "subjectName": "文具用品",
                "memo": null,
                "createdAt": "2026-08-07T04:26:58Z",
                "invoice": {
                    "uuid": "972e507c-4d9c-4bed-ab20-bfb1f40a393e",
                    "invoiceTrack": "EF",
                    "invoiceNumber": "30000001",
                    "date": "1150807",
                    "amount": 840,
                    "businessTax": 40,
                    "buyOrSell": 2,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": ""
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "e32fc650-2949-41d0-95f2-92a4867bf1ae",
                "orderCode": "TX-115080700031",
                "entryDate": null,
                "issueDate": "1150807",
                "entryType": 0,
                "entryKind": 0,
                "direction": 3,
                "status": 1,
                "counterpartyName": "測試供應商A",
                "counterpartyType": 1,
                "counterpartyUuid": null,
                "totalAmount": 1050,
                "netAmount": 1000,
                "taxAmount": 50,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 1050,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 10,
                "subjectName": "文具用品",
                "memo": null,
                "createdAt": "2026-08-07T05:32:46Z",
                "invoice": {
                    "uuid": "4b423130-a491-40c1-b818-fb1c93ee5738",
                    "invoiceTrack": "AB",
                    "invoiceNumber": "12345678",
                    "date": "1150807",
                    "amount": 1050,
                    "businessTax": 50,
                    "buyOrSell": 2,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": ""
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "0b28bf94-3e9a-4efc-8ea8-531558dcb525",
                "orderCode": "TX-115080700032",
                "entryDate": null,
                "issueDate": "1150807",
                "entryType": 0,
                "entryKind": 0,
                "direction": 3,
                "status": 1,
                "counterpartyName": "測試供應商A",
                "counterpartyType": 1,
                "counterpartyUuid": null,
                "totalAmount": 2100,
                "netAmount": 2000,
                "taxAmount": 100,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 2100,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 10,
                "subjectName": "文具用品",
                "memo": null,
                "createdAt": "2026-08-07T05:34:24Z",
                "invoice": {
                    "uuid": "3728bf42-286d-4f5e-99d3-635be27a36ea",
                    "invoiceTrack": "AB",
                    "invoiceNumber": "12345679",
                    "date": "1150807",
                    "amount": 2100,
                    "businessTax": 100,
                    "buyOrSell": 2,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": ""
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "f0ca3739-a0c7-464f-8dd9-d4e74e802f01",
                "orderCode": "TX-115081100015",
                "entryDate": null,
                "issueDate": "1150812",
                "entryType": 0,
                "entryKind": 0,
                "direction": 3,
                "status": 1,
                "counterpartyName": "測試廠商A",
                "counterpartyType": 0,
                "counterpartyUuid": "8208f5b3-3868-4868-afff-be8e83e483a7",
                "totalAmount": 3000,
                "netAmount": 3000,
                "taxAmount": 0,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 3000,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 10,
                "subjectName": "文具用品",
                "memo": null,
                "createdAt": "2026-08-11T10:08:38Z",
                "invoice": {
                    "uuid": "56e097b8-0974-4546-9be7-1e8186f61779",
                    "invoiceTrack": "AB",
                    "invoiceNumber": "12345602",
                    "date": "1150812",
                    "amount": 3000,
                    "businessTax": 0,
                    "buyOrSell": 2,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": "99999999"
                },
                "isAllowance": false
            }
        ],
        "total": 10,
        "limit": 10,
        "page": 1,
        "receivedVoucherAmount": 27500,
        "paidAmount": 6100,
        "payableAmount": 21400
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» items|[object]|true|none||none|
|»»» ledgerUuid|string|true|none||none|
|»»» orderCode|string|true|none||none|
|»»» entryDate|string¦null|true|none||none|
|»»» issueDate|string|true|none||none|
|»»» entryType|integer|true|none||none|
|»»» entryKind|integer|true|none||none|
|»»» direction|integer|true|none||none|
|»»» status|integer|true|none||none|
|»»» counterpartyName|string|true|none||none|
|»»» counterpartyType|integer|true|none||none|
|»»» counterpartyUuid|string¦null|true|none||none|
|»»» totalAmount|integer|true|none||none|
|»»» netAmount|integer|true|none||none|
|»»» taxAmount|integer|true|none||none|
|»»» taxFreeAmount|integer|true|none||none|
|»»» settledAmount|integer|true|none||none|
|»»» remainingAmount|integer|true|none||none|
|»»» settlementStatus|integer|true|none||none|
|»»» officialAccountingSubjectId|integer|true|none||none|
|»»» subjectName|string|true|none||none|
|»»» memo|string¦null|true|none||none|
|»»» createdAt|string|true|none||none|
|»»» invoice|object|true|none||none|
|»»»» uuid|string|true|none||none|
|»»»» invoiceTrack|string|true|none||none|
|»»»» invoiceNumber|string|true|none||none|
|»»»» date|string|true|none||none|
|»»»» amount|integer|true|none||none|
|»»»» businessTax|integer|true|none||none|
|»»»» buyOrSell|integer|true|none||none|
|»»»» ourInvoiceType|integer|true|none||none|
|»»»» counterpartyTaxId|string|true|none||none|
|»»» isAllowance|boolean|true|none||進折／銷折為 true|
|»»» originLedgerUuid|string|true|none||折讓時有值，指原單|
|»»» allowanceCount|integer|true|none||原單已開折讓張數；折讓列為 0|
|»» total|integer|true|none||none|
|»» limit|integer|true|none||none|
|»» page|integer|true|none||none|
|»» receivedVoucherAmount|integer|true|none||none|
|»» paidAmount|integer|true|none||none|
|»» payableAmount|integer|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## POST 應收帳款列表篩選

POST /ael/ledger/receivables/filter

應收列表篩選

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "dateFrom": "20260701",
    "dateTo": "20260731",
    "amountFrom": 100,
    "amountTo": 50000,
    "limit": 10,
    "page": 1
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |none|
|» dateFrom|body|string| no |日期起，YYYYMMDD|
|» dateTo|body|string| no |日期迄，YYYYMMDD|
|» amountFrom|body|integer| no |金額下限|
|» amountTo|body|integer| no |金額上限|
|» limit|body|integer| yes |一頁筆數|
|» page|body|integer| yes |頁碼|
|» filterType|body|integer| no |0 交易編號、1 發票號碼；兩者皆空＝不篩；必須和filterValue一起傳，只傳一邊 → 400|
|» filterValue|body|string| no |篩選值|

> Response Examples

> 200 Response

```json
{
    "data": {
        "items": [
            {
                "ledgerUuid": "44026f3e-4eba-4376-8f44-ecc125e82876",
                "orderCode": "TX-115073100005",
                "entryDate": null,
                "issueDate": "1150710",
                "entryType": 2,
                "entryKind": 0,
                "direction": 2,
                "status": 1,
                "counterpartyName": "潤智教育有限公司",
                "counterpartyType": 0,
                "counterpartyUuid": null,
                "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                "paymentChannelName": "蝦皮",
                "totalAmount": 5040,
                "netAmount": 4000,
                "taxAmount": 40,
                "taxFreeAmount": 1000,
                "settledAmount": 0,
                "remainingAmount": 5040,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 1,
                "subjectName": "營業收入總額",
                "memo": null,
                "createdAt": "2026-07-31T07:06:51Z",
                "invoice": {
                    "uuid": "1a4b0bd9-3ad4-4966-866f-2d000dc2251d",
                    "invoiceTrack": "HH",
                    "invoiceNumber": "60889000",
                    "date": "1150710",
                    "amount": 5040,
                    "businessTax": 40,
                    "buyOrSell": 3,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": "95441885"
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "f2ab9a2e-8cf0-43b7-89c4-29c2d4fc38a7",
                "orderCode": "TX-115073100008",
                "entryDate": null,
                "issueDate": "1150701",
                "entryType": 2,
                "entryKind": 0,
                "direction": 2,
                "status": 1,
                "counterpartyName": "潤智教育有限公司",
                "counterpartyType": 0,
                "counterpartyUuid": null,
                "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                "paymentChannelName": "蝦皮",
                "totalAmount": 30000,
                "netAmount": 30000,
                "taxAmount": 0,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 30000,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 1,
                "subjectName": "營業收入總額",
                "memo": null,
                "createdAt": "2026-07-31T08:45:29Z",
                "invoice": {
                    "uuid": "029a4783-9767-4d0e-80bd-8305a6b46538",
                    "invoiceTrack": "RR",
                    "invoiceNumber": "56000000",
                    "date": "1150701",
                    "amount": 30000,
                    "businessTax": 0,
                    "buyOrSell": 3,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": "95441885"
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "a10f2060-01d8-48b1-b26a-cbce12caaece",
                "orderCode": "TX-115080600009",
                "entryDate": null,
                "issueDate": "1150806",
                "entryType": 2,
                "entryKind": 0,
                "direction": 2,
                "status": 1,
                "counterpartyName": "測試買家C",
                "counterpartyType": 0,
                "counterpartyUuid": null,
                "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                "paymentChannelName": "蝦皮",
                "totalAmount": 0,
                "netAmount": 100,
                "taxAmount": 0,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 0,
                "settlementStatus": 0,
                "officialAccountingSubjectId": 1,
                "subjectName": "營業收入總額",
                "memo": null,
                "createdAt": "2026-08-06T09:16:47Z",
                "invoice": {
                    "uuid": "ac4ba738-a92b-4f48-a70a-b8f680ffb0c1",
                    "invoiceTrack": "99",
                    "invoiceNumber": "900003",
                    "date": "1150806",
                    "amount": 0,
                    "businessTax": 0,
                    "buyOrSell": 3,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": ""
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "ac93b74f-9861-404b-a417-df2e021e9c24",
                "orderCode": "TX-115080700017",
                "entryDate": null,
                "issueDate": "1150807",
                "entryType": 2,
                "entryKind": 0,
                "direction": 2,
                "status": 1,
                "counterpartyName": "測試買家二",
                "counterpartyType": 1,
                "counterpartyUuid": null,
                "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                "paymentChannelName": "蝦皮",
                "totalAmount": 2100,
                "netAmount": 2000,
                "taxAmount": 100,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 2100,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 1,
                "subjectName": "營業收入總額",
                "memo": null,
                "createdAt": "2026-08-07T04:21:58Z",
                "invoice": {
                    "uuid": "42d57d54-284e-4263-ab37-9d3aae591223",
                    "invoiceTrack": "AB",
                    "invoiceNumber": "10000002",
                    "date": "1150807",
                    "amount": 2100,
                    "businessTax": 100,
                    "buyOrSell": 3,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": ""
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "986cedb4-1f69-40fc-94a4-e2f71d140503",
                "orderCode": "TX-115080700018",
                "entryDate": null,
                "issueDate": "1150807",
                "entryType": 2,
                "entryKind": 0,
                "direction": 2,
                "status": 1,
                "counterpartyName": "測試買家三",
                "counterpartyType": 1,
                "counterpartyUuid": null,
                "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                "paymentChannelName": "蝦皮",
                "totalAmount": 3150,
                "netAmount": 3000,
                "taxAmount": 150,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 3150,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 1,
                "subjectName": "營業收入總額",
                "memo": null,
                "createdAt": "2026-08-07T04:23:02Z",
                "invoice": {
                    "uuid": "f3e07762-efa0-4b37-89e6-f92b5b3a3549",
                    "invoiceTrack": "AB",
                    "invoiceNumber": "10000003",
                    "date": "1150807",
                    "amount": 3150,
                    "businessTax": 150,
                    "buyOrSell": 3,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": ""
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "3b89af58-f323-4f76-84eb-6ef24ac80ef0",
                "orderCode": "TX-115080700035",
                "entryDate": null,
                "issueDate": "1150804",
                "entryType": 2,
                "entryKind": 0,
                "direction": 2,
                "status": 1,
                "counterpartyName": "測試公司一",
                "counterpartyType": 0,
                "counterpartyUuid": null,
                "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                "paymentChannelName": "蝦皮",
                "totalAmount": 300000,
                "netAmount": 300000,
                "taxAmount": 0,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 300000,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 10,
                "subjectName": "文具用品",
                "memo": null,
                "createdAt": "2026-08-07T07:56:33Z",
                "invoice": {
                    "uuid": "c0aa04e6-995d-4d81-968b-292af4c9f53a",
                    "invoiceTrack": "OO",
                    "invoiceNumber": "32340000",
                    "date": "1150804",
                    "amount": 300000,
                    "businessTax": 0,
                    "buyOrSell": 3,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": "32481939"
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "a781b07d-4127-4055-b5cc-680f55daf985",
                "orderCode": "TX-115080700037",
                "entryDate": null,
                "issueDate": "1150806",
                "entryType": 2,
                "entryKind": 0,
                "direction": 2,
                "status": 1,
                "counterpartyName": "測試二二二",
                "counterpartyType": 0,
                "counterpartyUuid": null,
                "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                "paymentChannelName": "蝦皮",
                "totalAmount": 43730,
                "netAmount": 40300,
                "taxAmount": 3430,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 43730,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 1,
                "subjectName": "營業收入總額",
                "memo": null,
                "createdAt": "2026-08-07T07:58:21Z",
                "invoice": {
                    "uuid": "27d89a2e-0058-4ffc-80b3-5d343bf28652",
                    "invoiceTrack": "ER",
                    "invoiceNumber": "34342483",
                    "date": "1150806",
                    "amount": 43730,
                    "businessTax": 3430,
                    "buyOrSell": 3,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": "42834343"
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "0b33c141-c694-40e1-b899-97bb42218dbd",
                "orderCode": "TX-115080700038",
                "entryDate": null,
                "issueDate": "1150811",
                "entryType": 2,
                "entryKind": 0,
                "direction": 2,
                "status": 1,
                "counterpartyName": "測試客戶一",
                "counterpartyType": 1,
                "counterpartyUuid": null,
                "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                "paymentChannelName": "蝦皮",
                "totalAmount": 12962,
                "netAmount": 12345,
                "taxAmount": 617,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 12962,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 1,
                "subjectName": "營業收入總額",
                "memo": null,
                "createdAt": "2026-08-07T07:59:04Z",
                "invoice": {
                    "uuid": "66aa3c2e-108c-4808-a019-f48a00a829ad",
                    "invoiceTrack": "AB",
                    "invoiceNumber": "10000001",
                    "date": "1150811",
                    "amount": 12962,
                    "businessTax": 617,
                    "buyOrSell": 3,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": ""
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "b2d3e3c7-0c62-414e-a0ad-9a04a30d865b",
                "orderCode": "TX-115080700039",
                "entryDate": null,
                "issueDate": "1150707",
                "entryType": 2,
                "entryKind": 0,
                "direction": 2,
                "status": 1,
                "counterpartyName": "測試測試",
                "counterpartyType": 0,
                "counterpartyUuid": null,
                "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                "paymentChannelName": "蝦皮",
                "totalAmount": 46490,
                "netAmount": 43000,
                "taxAmount": 3490,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 46490,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 10,
                "subjectName": "文具用品",
                "memo": null,
                "createdAt": "2026-08-07T07:59:08Z",
                "invoice": {
                    "uuid": "6e0ece6d-4f7c-400e-9c14-c9924775b9c3",
                    "invoiceTrack": "EI",
                    "invoiceNumber": "34234234",
                    "date": "1150707",
                    "amount": 46490,
                    "businessTax": 3490,
                    "buyOrSell": 3,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": "40343490"
                },
                "isAllowance": false
            },
            {
                "ledgerUuid": "da6c16f7-e7d1-47a5-b4b0-d776c2cfd928",
                "orderCode": "TX-115080700041",
                "entryDate": null,
                "issueDate": "1150803",
                "entryType": 2,
                "entryKind": 0,
                "direction": 2,
                "status": 1,
                "counterpartyName": "測試測試",
                "counterpartyType": 0,
                "counterpartyUuid": null,
                "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                "paymentChannelName": "蝦皮",
                "totalAmount": 3434,
                "netAmount": 3400,
                "taxAmount": 34,
                "taxFreeAmount": 0,
                "settledAmount": 0,
                "remainingAmount": 3434,
                "settlementStatus": 2,
                "officialAccountingSubjectId": 10,
                "subjectName": "文具用品",
                "memo": null,
                "createdAt": "2026-08-07T08:00:28Z",
                "invoice": {
                    "uuid": "d362defc-2e1e-4a36-9dfe-79f7e68fb1c5",
                    "invoiceTrack": "PE",
                    "invoiceNumber": "34889234",
                    "date": "1150803",
                    "amount": 3434,
                    "businessTax": 34,
                    "buyOrSell": 3,
                    "ourInvoiceType": 3,
                    "counterpartyTaxId": "34892343"
                },
                "isAllowance": false
            }
        ],
        "total": 16,
        "limit": 10,
        "page": 1,
        "issuedVoucherAmount": 932190,
        "collectedAmount": 33566,
        "receivableAmount": 898624
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» items|[object]|true|none||none|
|»»» ledgerUuid|string|true|none||none|
|»»» orderCode|string|true|none||none|
|»»» entryDate|null|true|none||none|
|»»» issueDate|string|true|none||none|
|»»» entryType|integer|true|none||none|
|»»» entryKind|integer|true|none||none|
|»»» direction|integer|true|none||none|
|»»» status|integer|true|none||none|
|»»» counterpartyName|string|true|none||none|
|»»» counterpartyType|integer|true|none||none|
|»»» counterpartyUuid|null|true|none||none|
|»»» paymentChannelUuid|string|true|none||none|
|»»» paymentChannelName|string|true|none||none|
|»»» totalAmount|integer|true|none||none|
|»»» netAmount|integer|true|none||none|
|»»» taxAmount|integer|true|none||none|
|»»» taxFreeAmount|integer|true|none||none|
|»»» settledAmount|integer|true|none||none|
|»»» remainingAmount|integer|true|none||none|
|»»» settlementStatus|integer|true|none||none|
|»»» officialAccountingSubjectId|integer|true|none||none|
|»»» subjectName|string|true|none||none|
|»»» memo|null|true|none||none|
|»»» createdAt|string|true|none||none|
|»»» invoice|object|true|none||none|
|»»»» uuid|string|true|none||none|
|»»»» invoiceTrack|string|true|none||none|
|»»»» invoiceNumber|string|true|none||none|
|»»»» date|string|true|none||none|
|»»»» amount|integer|true|none||none|
|»»»» businessTax|integer|true|none||none|
|»»»» buyOrSell|integer|true|none||none|
|»»»» ourInvoiceType|integer|true|none||none|
|»»»» counterpartyTaxId|string|true|none||none|
|»»» isAllowance|boolean|true|none||進折／銷折為 true|
|»»» originLedgerUuid|string|true|none||折讓時有值，指原單|
|»»» allowanceCount|integer|true|none||原單已開折讓張數；折讓列為 0|
|»» total|integer|true|none||none|
|»» limit|integer|true|none||none|
|»» page|integer|true|none||none|
|»» issuedVoucherAmount|integer|true|none||none|
|»» collectedAmount|integer|true|none||none|
|»» receivableAmount|integer|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## POST 已付款列表篩選

POST /ael/ledger/payables/paid/filter

已付款列表篩選

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "dateFrom": "20260701",
    "dateTo": "20260731",
    "amountFrom": 100,
    "amountTo": 50000,
    "limit": 10,
    "page": 1
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |none|
|» dateFrom|body|string| no |日期起，YYYYMMDD|
|» dateTo|body|string| no |日期迄，YYYYMMDD|
|» amountFrom|body|integer| no |金額下限|
|» amountTo|body|integer| no |金額上限|
|» limit|body|integer| yes |一頁筆數|
|» page|body|integer| yes |頁碼|
|» filterType|body|integer| no |0 交易編號、1 發票號碼；兩者皆空＝不篩；必須和filterValue一起傳，只傳一邊 → 400|
|» filterValue|body|string| no |篩選值|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 已收款列表篩選

POST /ael/ledger/receivables/collected/filter

已收款列表篩選

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "dateFrom": "20260701",
    "dateTo": "20260731",
    "amountFrom": 100,
    "amountTo": 50000,
    "limit": 10,
    "page": 1
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |none|
|» dateFrom|body|string| no |日期起，YYYYMMDD|
|» dateTo|body|string| no |日期迄，YYYYMMDD|
|» amountFrom|body|integer| no |金額下限|
|» amountTo|body|integer| no |金額上限|
|» limit|body|integer| yes |一頁筆數|
|» page|body|integer| yes |頁碼|
|» filterType|body|integer| no |0 交易編號、1 發票號碼；兩者皆空＝不篩；必須和filterValue一起傳，只傳一邊 → 400|
|» filterValue|body|string| no |篩選值|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET 查看交易細節

GET /ael/ledger/entries/detail

查看交易細節

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|companyUuid|query|string| no |公司uuid|
|ledgerUuid|query|string| no |交易uuid|

> Response Examples

> 200 Response

```json
{
    "data": {
        "entry": {
            "uuid": "43fd34ea-dfee-42d3-810a-d26359484373",
            "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
            "orderCode": "TX-115073000004",
            "entryDate": "2026-02-05T00:00:00Z",
            "transactionDate": "2026-02-01T00:00:00Z",
            "entryType": 0,
            "direction": 3,
            "counterpartyName": "測試廠商",
            "counterpartyType": 0,
            "counterpartyUuid": null,
            "paymentChannelUuid": null,
            "paymentChannelName": "",
            "summary": null,
            "memo": null,
            "totalAmount": 10500,
            "netAmount": 10000,
            "taxAmount": 500,
            "taxFreeAmount": 0,
            "entryKind": 0,
            "status": 1,
            "officialAccountingSubjectId": 10,
            "subjectName": "文具用品",
            "createdAt": "2026-07-30T10:24:43Z",
            "updatedAt": "2026-07-30T10:24:43Z",
            "settledAmount": 0,
            "remainingAmount": 10500,
            "settlementStatus": 2
        },
        "settlements": [
            {
                "relationUuid": "85d31606-110d-480b-9bd1-0d97ed646fce",
                "settlementAmount": 150,
                "beforeSettlementAmount": 210,
                "afterSettlementAmount": 60,
                "isOpen": true,
                "remark": null,
                "createdAt": "2026-07-29T09:39:17Z",
                "settlement": {
                    "uuid": "dc3b65a3-119d-4358-94f5-f229051b9a96",
                    "orderCode": "TX-115072900005",
                    "entryDate": "2026-07-29T00:00:00Z",
                    "transactionDate": "2026-07-29T00:00:00Z",
                    "entryType": 0,
                    "direction": 1,
                    "entryKind": 1,
                    "totalAmount": 150,
                    "netAmount": 150,
                    "taxAmount": 0,
                    "memo": "沖帳測試",
                    "status": 1,
                    "createdAt": "2026-07-29T09:39:17Z"
                }
            }
        ],
        "invoice": {
            "uuid": "ba6db6c6-b686-4f67-9de7-372000226ef2",
            "ac_uuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
            "inoviceBookUuid": null,
            "ourInvoiceType": 3,
            "buyOrSell": 2,
            "isDebit": 2,
            "year": 115,
            "month": 2,
            "day": 1,
            "date": "1150201",
            "buyerTaxIdNumber": "82999614",
            "sellerTaxIdNumber": "12345678",
            "invoiceTrack": "AB",
            "invoiceNumber": "12345678",
            "customsNumber": "",
            "sales": 10000,
            "businessTax": 500,
            "amount": 10500,
            "taxFreeAmount": 0,
            "taxType": "1",
            "specialTaxRate": 0,
            "invoicePicUrl": "",
            "createTime": "2026-07-30T10:24:43Z",
            "updateTime": "2026-07-30T10:24:43Z",
            "costCategory": 0,
            "remark": "",
            "remarkCms": "",
            "remarkMsgBoard": "",
            "companyName": "測試廠商",
            "cmsYear": 115,
            "cmsPhase": 1,
            "deductible": 1,
            "declared": 2,
            "importData": 0,
            "starCustomer": 0,
            "isReturnGoods": false,
            "importTaxNumber": "",
            "others": 0,
            "pdfPassword": "",
            "unreportedReason": "",
            "summary": "",
            "carrierInfo": "",
            "savePoint": 0
        }
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» isAllowance|boolean|true|none||是否為折讓|
|» entry|object|true|none||業務原單 header＋科目／管道名＋沖帳快照|
|»» ledgerUuid|string|true|none||ledger_entries.uuid（業務原單）|
|»» companyUuid|string|true|none||公司 uuid|
|»» orderCode|string|true|none||交易編號|
|»» entryDate|string¦null|false|none||入帳日，YYYY-MM-DD|
|»» transactionDate|string¦null|false|none||交易發生日|
|»» entryType|integer|true|none||0進項 1進折 2銷項 3銷折|
|»» direction|integer¦null|false|none||0收入 1支出 2應收 3應付 4其他|
|»» counterpartyName|string¦null|false|none||交易對象名稱|
|»» counterpartyType|integer¦null|false|none||0廠商 1個人|
|»» counterpartyUuid|string¦null|false|none||廠商 uuid|
|»» paymentChannelUuid|string¦null|false|none||銷售管道 uuid|
|»» paymentChannelName|string|true|none||管道名稱（無則空字串）|
|»» summary|string¦null|false|none||摘要|
|»» memo|string¦null|false|none||備註|
|»» totalAmount|number|true|none||總金額|
|»» netAmount|number|true|none||淨額|
|»» taxAmount|number|true|none||稅額|
|»» taxFreeAmount|number|true|none||免稅銷售額|
|»» entryKind|integer|true|none||固定 0（業務原單）|
|»» status|integer|true|none||0作廢 1已確認 2草稿|
|»» officialAccountingSubjectId|integer|true|none||官方科目 id|
|»» subjectName|string|true|none||科目名稱|
|»» createdAt|string|true|none||none|
|»» updatedAt|string|true|none||none|
|»» settledAmount|integer|true|none||已沖金額（元）＝relations.settlement_amount 合計|
|»» remainingAmount|integer|true|none||未沖金額（元）；可為負（超沖）|
|»» settlementStatus|integer|true|none||0平衡 1超沖 2少沖|
|» originLedgerUuid|string|true|none||如果是查折讓單，這邊顯示的是原單uuid|
|» allowances|[object]|true|none||關聯折讓單|
|»» ledgerUuid|string|true|none||交易uuid|
|»» orderCode|string|true|none||交易編號|
|»» totalAmount|integer|true|none||含稅總額|
|»» netAmount|integer|true|none||未稅額|
|»» taxAmount|integer|true|none||稅額|
|»» allowanceAmount|integer|true|none||折讓金額|
|»» direction|integer|true|none||0收入 1支出 2應收 3應付 4其他|
|» settlements|[object]|true|none||沖帳關聯列表；無沖帳為空陣列（撤銷後 relations 會刪除）|
|»» relationUuid|string|true|none||receivable_payable_relations.uuid|
|»» settlementAmount|integer|true|none||本次沖帳金額|
|»» beforeSettlementAmount|integer|true|none||沖之前剩餘|
|»» afterSettlementAmount|integer|true|none||沖之後剩餘|
|»» isOpen|boolean|true|none||true＝沖完後原單仍有餘額；false＝已結清（含超沖）|
|»» remark|string¦null|false|none||關聯備註|
|»» createdAt|string|true|none||none|
|»» relationKind|string|true|none||1＝折讓沖減，0＝一般付款沖帳|
|»» settlement|object¦null|false|none||結算帳 header（不含分錄 lines）|
|»»» ledgerUuid|string|false|none||結算 ledger_entries.uuid|
|»»» orderCode|string|false|none||結算交易編號|
|»»» entryDate|string¦null|false|none||入帳日，YYYY-MM-DD|
|»»» transactionDate|string¦null|false|none||交易發生日|
|»»» entryType|integer|false|none||0進項 1進折 2銷項 3銷折|
|»»» direction|integer¦null|false|none||0收入 1支出 2應收 3應付 4其他|
|»»» entryKind|integer|false|none||固定 1（沖帳結算）|
|»»» reconciliationMethod|integer¦null|false|none||0手動／1既付(收)／2匯總／3自動|
|»»» totalAmount|number|false|none||主結算表頭金額（多為實際收付）|
|»»» netAmount|number|false|none||none|
|»»» taxAmount|number|false|none||none|
|»»» bankAccountUuid|string¦null|false|none||銀行帳戶uuid|
|»»» feeAmount|integer|false|none||手續費（自分錄 debit 推導）|
|»»» depositAmount|integer|false|none||實際存入（自分錄第一筆 debit 推導；進項語意可能為 0）|
|»»» memo|string¦null|false|none||none|
|»»» status|integer|false|none||0作廢 1已確認 2草稿|
|»»» createdAt|string(date-time)|false|none||none|
|» settleEvents|[object]|true|none||此原單相關沖帳事件（供撤銷）；無則空陣列|
|»» settleEventUuid|string|true|none||settle_events.uuid|
|»» reconMethod|integer|true|none||0手動沖帳／1開立上傳發票即沖帳／2匯總沖帳|
|»» side|integer|true|none||0銷項／1進項|
|»» paymentDate|string|true|none||付款／收款日 YYYYMMDD|
|»» settleAmount|integer|true|none||帳面沖帳金額|
|»» cashAmount|integer|true|none||實際收付（payment／deposit）|
|»» balanceBefore|integer|true|none||沖前廠商／銷售管道餘額|
|»» balanceAfter|integer|true|none||沖後廠商／銷售管道餘額|
|»» isReverse|boolean|true|none||是否已撤銷|
|»» createdAt|string(date-time)|true|none||none|
|»» canReverse|boolean|true|none||目前是否可撤銷（未撤銷且無更新的未撤銷事件）|
|» invoice|object¦null|false|none||完整 invoice_info；無票為 null。year／date 為民國|
|»» invoiceUuid|string|false|none||invoice_info.uuid|
|»» ac_uuid|string|false|none||none|
|»» inoviceBookUuid|string¦null|false|none||none|
|»» ourInvoiceType|integer|false|none||none|
|»» buyOrSell|integer|false|none||進／銷項|
|»» isDebit|integer|false|none||是否折讓 1折讓 2不是折讓|
|»» year|integer|false|none||民國年|
|»» month|integer|false|none||none|
|»» day|integer|false|none||none|
|»» date|string|false|none||民國日 YYYMMDD，如 1150314|
|»» buyerTaxIdNumber|string|false|none||none|
|»» sellerTaxIdNumber|string|false|none||none|
|»» invoiceTrack|string|false|none||none|
|»» invoiceNumber|string|false|none||none|
|»» customsNumber|string|false|none||none|
|»» sales|integer|false|none||none|
|»» businessTax|integer|false|none||none|
|»» amount|integer|false|none||none|
|»» taxFreeAmount|integer|false|none||none|
|»» taxType|string|false|none||none|
|»» specialTaxRate|integer|false|none||none|
|»» invoicePicUrl|string|false|none||none|
|»» createTime|string(date-time)|false|none||none|
|»» updateTime|string(date-time)|false|none||none|
|»» costCategory|integer|false|none||none|
|»» remark|string|false|none||none|
|»» remarkCms|string|false|none||none|
|»» remarkMsgBoard|string|false|none||none|
|»» companyName|string|false|none||none|
|»» cmsYear|integer|false|none||none|
|»» cmsPhase|integer|false|none||none|
|»» deductible|integer|false|none||1可扣抵 2不可扣抵|
|»» declared|integer|false|none||1已申報 2未申報|
|»» importData|integer|false|none||none|
|»» starCustomer|integer|false|none||none|
|»» isReturnGoods|boolean|false|none||none|
|»» importTaxNumber|string|false|none||none|
|»» others|integer|false|none||none|
|»» pdfPassword|string|false|none||none|
|»» unreportedReason|string|false|none||none|
|»» summary|string|false|none||none|
|»» carrierInfo|string|false|none||none|
|»» savePoint|integer|false|none||none|

## POST 建立進折交易紀錄

POST /ael/ledger/payables/allowance

建立進折交易紀錄

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "originLedgerUuid": "",
    "datetime": "20260811",
    "totalAmount": 1050,
    "netAmount": 1000,
    "taxAmount": 50,
    "officialAccountingSubjectId": 20,
    "memo": ""
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司uuid|
|» originLedgerUuid|body|string| yes |欲折讓的原單交易uuid|
|» datetime|body|string| yes |YYYYMMDD|
|» totalAmount|body|integer| yes |含稅總額|
|» netAmount|body|integer| yes |未稅|
|» taxAmount|body|integer| yes |稅額|
|» officialAccountingSubjectId|body|integer| yes |科目id|
|» memo|body|string| no |備註|

> Response Examples

> 200 Response

```json
{
  "success": true,
  "errorCode": "string",
  "message": "string",
  "data": {
    "allowance": {
      "ledgerUuid": "string",
      "orderCode": "string",
      "entryType": 0,
      "direction": 0,
      "totalAmount": 0,
      "netAmount": 0,
      "taxAmount": 0,
      "officialAccountingSubjectId": 0
    },
    "originLedgerUuid": "string",
    "relation": {
      "relationUuid": "string",
      "settlementAmount": 0,
      "beforeSettlementAmount": 0,
      "afterSettlementAmount": 0,
      "isOpen": true,
      "relationKind": 0
    },
    "originRemainingAmount": 0,
    "balanceBefore": 0,
    "balanceAfter": 0,
    "closed": true
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|false|none||none|
|» errorCode|string|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|
|»» allowance|object|false|none||none|
|»»» ledgerUuid|string|false|none||none|
|»»» orderCode|string|false|none||none|
|»»» entryType|integer|false|none||進折=進項退回類型|
|»»» direction|integer¦null|false|none||none|
|»»» totalAmount|number|false|none||none|
|»»» netAmount|number|false|none||none|
|»»» taxAmount|number|false|none||none|
|»»» officialAccountingSubjectId|integer|false|none||none|
|»» originLedgerUuid|string|false|none||none|
|»» relation|object|false|none||none|
|»»» relationUuid|string|false|none||none|
|»»» settlementAmount|integer|false|none||none|
|»»» beforeSettlementAmount|integer|false|none||none|
|»»» afterSettlementAmount|integer|false|none||none|
|»»» isOpen|boolean|false|none||none|
|»»» relationKind|integer|false|none||折讓=1|
|»» originRemainingAmount|integer|false|none||none|
|»» balanceBefore|integer|false|none||none|
|»» balanceAfter|integer|false|none||none|
|»» closed|boolean|false|none||none|

## POST 建立銷折交易紀錄

POST /ael/ledger/receivables/allowance

建立銷折交易紀錄

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "originLedgerUuid": "",
    "datetime": "20260811",
    "totalAmount": 1050,
    "netAmount": 1000,
    "taxAmount": 50,
    "officialAccountingSubjectId": 20,
    "memo": ""
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司uuid|
|» originLedgerUuid|body|string| yes |欲折讓的原單交易uuid|
|» datetime|body|string| yes |YYYYMMDD|
|» totalAmount|body|integer| yes |含稅總額|
|» netAmount|body|integer| yes |未稅|
|» taxAmount|body|integer| yes |稅額|
|» officialAccountingSubjectId|body|integer| yes |科目id|
|» memo|body|string| no |備註|

> Response Examples

> 200 Response

```json
{
  "success": true,
  "errorCode": "string",
  "message": "string",
  "data": {
    "allowance": {
      "ledgerUuid": "string",
      "orderCode": "string",
      "entryType": 0,
      "direction": 0,
      "totalAmount": 0,
      "netAmount": 0,
      "taxAmount": 0,
      "officialAccountingSubjectId": 0
    },
    "originLedgerUuid": "string",
    "relation": {
      "relationUuid": "string",
      "settlementAmount": 0,
      "beforeSettlementAmount": 0,
      "afterSettlementAmount": 0,
      "isOpen": true,
      "relationKind": 0
    },
    "originRemainingAmount": 0,
    "balanceBefore": 0,
    "balanceAfter": 0,
    "closed": true
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|false|none||none|
|» errorCode|string|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|
|»» allowance|object|false|none||none|
|»»» ledgerUuid|string|false|none||none|
|»»» orderCode|string|false|none||none|
|»»» entryType|integer|false|none||進折=進項退回類型|
|»»» direction|integer¦null|false|none||none|
|»»» totalAmount|number|false|none||none|
|»»» netAmount|number|false|none||none|
|»»» taxAmount|number|false|none||none|
|»»» officialAccountingSubjectId|integer|false|none||none|
|»» originLedgerUuid|string|false|none||none|
|»» relation|object|false|none||none|
|»»» relationUuid|string|false|none||none|
|»»» settlementAmount|integer|false|none||none|
|»»» beforeSettlementAmount|integer|false|none||none|
|»»» afterSettlementAmount|integer|false|none||none|
|»»» isOpen|boolean|false|none||none|
|»»» relationKind|integer|false|none||折讓=1|
|»» originRemainingAmount|integer|false|none||none|
|»» balanceBefore|integer|false|none||none|
|»» balanceAfter|integer|false|none||none|
|»» closed|boolean|false|none||none|

## GET 發票號碼反查業務原單

GET /ael/ledger/invoices/origin

發票號碼反查業務原單

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|companyUuid|query|string| no |公司uuid|
|invoiceTrack|query|string| no |發票字軌|
|invoiceNumber|query|string| no |發票號碼|

> Response Examples

> 200 Response

```json
{
    "data": {
        "invoiceUuid": "56e097b8-0974-4546-9be7-1e8186f61779",
        "entry": {
            "ledgerUuid": "f0ca3739-a0c7-464f-8dd9-d4e74e802f01",
            "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
            "orderCode": "TX-115081100015",
            "entryDate": null,
            "transactionDate": "2026-08-12T00:00:00Z",
            "entryType": 0,
            "direction": 3,
            "counterpartyName": "測試廠商A",
            "counterpartyType": 0,
            "counterpartyUuid": "8208f5b3-3868-4868-afff-be8e83e483a7",
            "paymentChannelUuid": null,
            "paymentChannelName": "",
            "summary": null,
            "memo": null,
            "totalAmount": 3000,
            "netAmount": 3000,
            "taxAmount": 0,
            "taxFreeAmount": 0,
            "entryKind": 0,
            "status": 1,
            "officialAccountingSubjectId": 10,
            "subjectName": "文具用品",
            "createdAt": "2026-08-11T10:08:38Z",
            "updatedAt": "2026-08-11T10:08:38Z",
            "settledAmount": 0,
            "remainingAmount": 3000,
            "settlementStatus": 2
        },
        "isAllowance": false,
        "allowances": [],
        "settlements": [],
        "settleEvents": [],
        "invoice": {
            "invoiceUuid": "56e097b8-0974-4546-9be7-1e8186f61779",
            "ac_uuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
            "inoviceBookUuid": null,
            "ourInvoiceType": 3,
            "buyOrSell": 2,
            "isDebit": 2,
            "year": 115,
            "month": 8,
            "day": 12,
            "date": "1150812",
            "buyerTaxIdNumber": "82999614",
            "sellerTaxIdNumber": "99999999",
            "invoiceTrack": "AB",
            "invoiceNumber": "12345602",
            "customsNumber": "",
            "sales": 3000,
            "businessTax": 0,
            "amount": 3000,
            "taxFreeAmount": 0,
            "taxType": "1",
            "specialTaxRate": 0,
            "invoicePicUrl": "",
            "createTime": "2026-08-11T10:08:38Z",
            "updateTime": "2026-08-11T10:08:38Z",
            "costCategory": 0,
            "remark": "",
            "remarkCms": "",
            "remarkMsgBoard": "",
            "companyName": "測試廠商A",
            "cmsYear": 115,
            "cmsPhase": 7,
            "deductible": 1,
            "declared": 2,
            "importData": 0,
            "starCustomer": 0,
            "isReturnGoods": false,
            "importTaxNumber": "",
            "others": 0,
            "pdfPassword": "",
            "unreportedReason": "",
            "summary": "",
            "carrierInfo": "",
            "savePoint": 0
        }
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» invoiceUuid|string|true|none||none|
|»» entry|object|true|none||none|
|»»» ledgerUuid|string|true|none||none|
|»»» companyUuid|string|true|none||none|
|»»» orderCode|string|true|none||none|
|»»» entryDate|null|true|none||none|
|»»» transactionDate|string|true|none||none|
|»»» entryType|integer|true|none||none|
|»»» direction|integer|true|none||none|
|»»» counterpartyName|string|true|none||none|
|»»» counterpartyType|integer|true|none||none|
|»»» counterpartyUuid|string|true|none||none|
|»»» paymentChannelUuid|null|true|none||none|
|»»» paymentChannelName|string|true|none||none|
|»»» summary|null|true|none||none|
|»»» memo|null|true|none||none|
|»»» totalAmount|integer|true|none||none|
|»»» netAmount|integer|true|none||none|
|»»» taxAmount|integer|true|none||none|
|»»» taxFreeAmount|integer|true|none||none|
|»»» entryKind|integer|true|none||none|
|»»» status|integer|true|none||none|
|»»» officialAccountingSubjectId|integer|true|none||none|
|»»» subjectName|string|true|none||none|
|»»» createdAt|string|true|none||none|
|»»» updatedAt|string|true|none||none|
|»»» settledAmount|integer|true|none||none|
|»»» remainingAmount|integer|true|none||none|
|»»» settlementStatus|integer|true|none||none|
|»» isAllowance|boolean|true|none||none|
|»» allowances|[string]|true|none||none|
|»» settlements|[string]|true|none||none|
|»» settleEvents|[string]|true|none||none|
|»» invoice|object|true|none||none|
|»»» invoiceUuid|string|true|none||none|
|»»» ac_uuid|string|true|none||none|
|»»» inoviceBookUuid|null|true|none||none|
|»»» ourInvoiceType|integer|true|none||none|
|»»» buyOrSell|integer|true|none||none|
|»»» isDebit|integer|true|none||none|
|»»» year|integer|true|none||none|
|»»» month|integer|true|none||none|
|»»» day|integer|true|none||none|
|»»» date|string|true|none||none|
|»»» buyerTaxIdNumber|string|true|none||none|
|»»» sellerTaxIdNumber|string|true|none||none|
|»»» invoiceTrack|string|true|none||none|
|»»» invoiceNumber|string|true|none||none|
|»»» customsNumber|string|true|none||none|
|»»» sales|integer|true|none||none|
|»»» businessTax|integer|true|none||none|
|»»» amount|integer|true|none||none|
|»»» taxFreeAmount|integer|true|none||none|
|»»» taxType|string|true|none||none|
|»»» specialTaxRate|integer|true|none||none|
|»»» invoicePicUrl|string|true|none||none|
|»»» createTime|string|true|none||none|
|»»» updateTime|string|true|none||none|
|»»» costCategory|integer|true|none||none|
|»»» remark|string|true|none||none|
|»»» remarkCms|string|true|none||none|
|»»» remarkMsgBoard|string|true|none||none|
|»»» companyName|string|true|none||none|
|»»» cmsYear|integer|true|none||none|
|»»» cmsPhase|integer|true|none||none|
|»»» deductible|integer|true|none||none|
|»»» declared|integer|true|none||none|
|»»» importData|integer|true|none||none|
|»»» starCustomer|integer|true|none||none|
|»»» isReturnGoods|boolean|true|none||none|
|»»» importTaxNumber|string|true|none||none|
|»»» others|integer|true|none||none|
|»»» pdfPassword|string|true|none||none|
|»»» unreportedReason|string|true|none||none|
|»»» summary|string|true|none||none|
|»»» carrierInfo|string|true|none||none|
|»»» savePoint|integer|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

# 帳簿/沖帳

## POST 手動沖帳進項應付帳款

POST /ael/ledger/payables/settle

手動沖帳進項應付帳款，永遠開放手動沖帳，允許超沖少沖

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "ledgerUuid": "59cca9cc-c794-48fd-96df-7bfabc28a58f",
    "paymentDate": "20260803",
    "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
    "settleAmount": 1100,
    "paymentAmount": 1050,
    "memo": "測試手續費跟雜費",
    "allocations": {
        "feeAmount": 30,
        "name": "手續費"
    },
    "otherDeductions": [
        {
            "officialAccountingSubjectId": 30,
            "amount": 20,
            "name": "雜費"
        }
    ]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司uuid|
|» ledgerUuid|body|string| yes |應付帳款uuid|
|» paymentDate|body|string| yes |交易付款日，YYYYMMDD|
|» bankAccountUuid|body|string| yes |銀行帳戶uuid|
|» settleAmount|body|integer| yes |沖帳金額|
|» paymentAmount|body|integer| yes |實際付款|
|» balanceUsed|body|integer| yes |使用餘額|
|» memo|body|string| yes |備註|
|» allocations|body|object| yes |沖帳手續費物件|
|»» feeAmount|body|integer| yes |none|
|»» name|body|string| yes |none|
|» otherDeductions|body|[object]| yes |沖帳其他減項物件|
|»» officialAccountingSubjectId|body|integer| yes |科目id|
|»» amount|body|integer| yes |沖帳金額|
|»» name|body|string| yes |沖帳項目名稱|

> Response Examples

> 200 Response

```json
{
    "data": {
        "payableLedgerUuid": "59cca9cc-c794-48fd-96df-7bfabc28a58f",
        "paymentDate": "20260803",
        "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
        "settleAmount": 1100,
        "paymentAmount": 1050,
        "allocations": [
            {
                "feeAmount": 30,
                "name": "手續費"
            }
        ],
        "otherDeductions": [
            {
                "officialAccountingSubjectId": 30,
                "amount": 20,
                "name": "雜費"
            }
        ],
        "settledAmount": 1100,
        "beforeRemaining": 1050,
        "afterRemaining": -50,
        "settlementStatus": 1,
        "settlementLedgerUuid": "75b41887-2467-4859-9b89-7a587034994c",
        "orderCode": "TX-115080300002",
        "relationUuid": "fad4e2fd-3e25-484f-af39-58e34a45c7c8",
        "closed": true
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» settlementLedgerUuid|string|true|none||none|
|»» orderCode|string|true|none||none|
|»» totalAmount|integer|true|none||none|
|»» relationUuids|[string]|true|none||none|
|»» closedPayableUuids|[string]|true|none||none|
|»» allocations|[object]|true|none||none|
|»»» payableLedgerUuid|string|false|none||none|
|»»» settledAmount|integer|false|none||none|
|»»» beforeRemaining|integer|false|none||none|
|»»» afterRemaining|integer|false|none||none|
|»»» settlementStatus|integer|false|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## POST 手動沖帳銷項應收帳款

POST /ael/ledger/receivables/settle

手動沖帳銷項應收帳款

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "ledgerUuid": "",
    "paymentDate": "20260803",
    "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
    "settleAmount": 1000,
    "depositAmount": 900,
    "memo": "",
    "allocations": {
        "feeAmount": 30,
        "name": ""
    },
    "otherDeductions": [
        {
            "officialAccountingSubjectId": 12,
            "amount": 70,
            "name": ""
        }
    ]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司uuid|
|» ledgerUuid|body|string| yes |應收帳款uuid|
|» paymentDate|body|string| yes |交易收款日，YYYYMMDD|
|» bankAccountUuid|body|string| yes |銀行帳戶uuid|
|» settleAmount|body|integer| yes |沖帳金額|
|» depositAmount|body|integer| yes |實際存入|
|» balanceUsed|body|integer| yes |使用餘額|
|» memo|body|string| yes |備註|
|» allocations|body|object| yes |沖帳手續費物件|
|»» feeAmount|body|integer| yes |none|
|»» name|body|string| yes |none|
|» otherDeductions|body|[object]| yes |沖帳其他減項物件|
|»» officialAccountingSubjectId|body|integer| yes |科目id|
|»» amount|body|integer| yes |沖帳金額|
|»» name|body|string| yes |沖帳項目名稱|

> Response Examples

> 200 Response

```json
{
    "data": {
        "totalAmount": 1050,
        "closedReceivableUuids": [
            "44790028-6c0d-4507-bf91-a7d2cec1ebaa"
        ],
        "allocations": [
            {
                "receivableLedgerUuid": "44790028-6c0d-4507-bf91-a7d2cec1ebaa",
                "paymentDate": "20260730",
                "settledAmount": 1050,
                "beforeRemaining": 1050,
                "afterRemaining": 0,
                "settlementStatus": 0,
                "settlementLedgerUuid": "fd941a76-e781-44dd-92e5-aa7182627523",
                "orderCode": "TX-115073000003",
                "relationUuid": "58dab6d2-3c89-45b9-94e9-9b7592966094"
            }
        ]
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 進項匯總沖帳預覽

POST /ael/ledger/reconciliation/payables/settle/preview

進項匯總沖帳預覽

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "counterpartyUuid": "301b53f8-1b59-4ecc-8836-ba6673e6baa7",
    "settleAmount": 800,
    "paymentAmount": 750,
    "isBalance": true,
    "allocations": {
        "feeAmount": 30,
        "name": "匯總手續費"
    },
    "otherDeductions": [
        {
            "officialAccountingSubjectId": 30,
            "amount": 20,
            "name": "雜費"
        }
    ]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司 UUID|
|» counterpartyUuid|body|string| yes |廠商uuid|
|» isDefault|body|boolean| yes |使用預設預覽嗎|
|» ledgerUuids|body|[string]| yes |要預覽匯總沖帳的自選 uuid 列表|
|» settleAmount|body|integer| yes |本次匯總沖帳總額（元）；依 transaction_date／created_at 由舊到新拆帳，超沖加在最後一筆|
|» paymentAmount|body|integer| yes |進項實際付出|
|» balanceUsed|body|integer| yes |使用餘額|
|» isBalance|body|boolean| yes |是否將超沖少沖的金額記進餘額|
|» allocations|body|object| yes |沖帳手續費物件|
|»» feeAmount|body|integer| yes |手續費|
|»» name|body|string| yes |沖帳項目名稱|
|» otherDeductions|body|[object]| yes |沖帳其他減項物件|
|»» officialAccountingSubjectId|body|integer| yes |科目id|
|»» name|body|string| yes |沖帳項目名稱|
|»» amount|body|integer| yes |沖帳金額|

> Response Examples

> 200 Response

```json
{
  "data": {
    "counterpartyUuid": "301b53f8-1b59-4ecc-8836-ba6673e6baa7",
    "settleAmount": 800,
    "paymentAmount": 750,
    "affectedCount": 4,
    "totalBeforeRemaining": 975,
    "allocations": [
      {
        "feeAmount": 30,
        "name": "匯總手續費",
        "settlementLedgerUuid": "",
        "orderCode": "",
        "relationUuid": ""
      }
    ],
    "otherDeductions": [
      {
        "officialAccountingSubjectId": 30,
        "amount": 20,
        "name": "雜費",
        "settlementLedgerUuid": "",
        "orderCode": "",
        "relationUuid": ""
      }
    ],
    "ledgerAllocations": [
      {
        "ledgerUuid": "9b435670-0281-4a26-b23d-743845b56323",
        "orderCode": "TX-115072900003",
        "transactionDate": "2026-07-29T00:00:00Z",
        "beforeRemaining": 30,
        "settleAmount": 30,
        "paymentAmount": 30,
        "feeAmount": 0,
        "deductionAmount": 0,
        "afterRemaining": 0,
        "settlementStatus": 0,
        "closed": true
      },
      {
        "ledgerUuid": "bb68bbc4-6e00-4a8f-8f9d-891d16487771",
        "orderCode": "TX-115080500002",
        "transactionDate": "2026-08-05T00:00:00Z",
        "beforeRemaining": 210,
        "settleAmount": 210,
        "paymentAmount": 210,
        "feeAmount": 0,
        "deductionAmount": 0,
        "afterRemaining": 0,
        "settlementStatus": 0,
        "closed": true
      },
      {
        "ledgerUuid": "4c59853a-89c6-4973-9261-f6db0b3a4a5c",
        "orderCode": "TX-115080500003",
        "transactionDate": "2026-08-05T00:00:00Z",
        "beforeRemaining": 315,
        "settleAmount": 315,
        "paymentAmount": 315,
        "feeAmount": 0,
        "deductionAmount": 0,
        "afterRemaining": 0,
        "settlementStatus": 0,
        "closed": true
      },
      {
        "ledgerUuid": "f0b88dba-8b8e-4d4e-a44c-a06ada541c66",
        "orderCode": "TX-115080500004",
        "transactionDate": "2026-08-05T00:00:00Z",
        "beforeRemaining": 420,
        "settleAmount": 245,
        "paymentAmount": 195,
        "feeAmount": 30,
        "deductionAmount": 20,
        "afterRemaining": 175,
        "settlementStatus": 2,
        "closed": false
      }
    ]
  },
  "errorCode": "0000",
  "message": "操作成功",
  "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» counterpartyUuid|string|false|none||廠商 uuid|
|» settleAmount|integer|true|none||本次匯總沖帳總額（元）|
|» appliedSettleAmount|integer|true|none||實際沖到原單合計金額|
|» paymentAmount|integer|true|none||實際異動銀行金額|
|» actualPaymentAmount|integer|true|none||實際異動銀行金額|
|» balanceBefore|integer|true|none||沖前廠商餘額|
|» balanceAfter|integer|true|none||沖後廠商餘額|
|» isBalance|boolean|true|none||是否將超沖少沖的金額記進餘額|
|» affectedCount|integer|true|none||實際有分配金額（alloc>0）的原單筆數|
|» totalBeforeRemaining|integer|true|none||拆帳前各原單 remaining 合計|
|» allocations|[object]|true|none||各原單拆帳結果（無結算 uuid）|
|»» ledgerUuid|string|true|none||原單 uuid|
|»» orderCode|string|true|none||原單交易編號|
|»» transactionDate|string¦null|false|none||原單交易日|
|»» beforeRemaining|integer|true|none||沖前剩餘（元）|
|»» settleAmount|integer|true|none||本次分配沖帳額（元）|
|»» afterRemaining|integer|true|none||沖後剩餘（元，可負＝超沖）|
|»» settlementStatus|integer|true|none||沖後狀態：0平衡 1超沖 2少沖|
|»» closed|boolean|true|none||本次沖後是否結清（after<=0 且有沖）|

## POST 進項匯總沖帳

POST /ael/ledger/reconciliation/payables/settle/summary

進項匯總沖帳
isBalance=true的話，paymentAmount要放實際沖完整的那幾筆金額總和（預覽會傳）

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "ledgerUuids": [
        "9b435670-0281-4a26-b23d-743845b56323",
        "bb68bbc4-6e00-4a8f-8f9d-891d16487771",
        "4c59853a-89c6-4973-9261-f6db0b3a4a5c",
        "f0b88dba-8b8e-4d4e-a44c-a06ada541c66"
    ],
    "settleAmount": 800,
    "paymentAmount": 750,
    "paymentDate": "20260805",
    "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
    "allocations": {
        "feeAmount": 30,
        "name": "匯總手續費"
    },
    "otherDeductions": [
        {
            "officialAccountingSubjectId": 30,
            "amount": 20,
            "name": "匯總雜費"
        }
    ]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司 UUID|
|» ledgerUuids|body|[string]| yes |要匯總沖帳的原單 uuid 列表（不可重複；應付須同廠商；應收須同銷售管道）|
|» settleAmount|body|integer| yes |本次匯總沖帳總額（元）；依 transaction_date／created_at 由舊到新拆帳，超沖加在最後一筆|
|» paymentAmount|body|integer| yes |進項實際付出|
|» paymentDate|body|string| yes |付款／收款日 YYYYMMDD,必填|
|» bankAccountUuid|body|string| yes |銀行帳戶 uuid,必填|
|» memo|body|string| no |備註（選填）|
|» balanceUsed|body|integer| yes |使用餘額|
|» allocations|body|object| yes |沖帳手續費物件|
|»» feeAmount|body|integer| yes |手續費|
|»» name|body|string| yes |沖帳項目名稱|
|» otherDeductions|body|[object]| yes |沖帳其他減項物件|
|»» officialAccountingSubjectId|body|integer| yes |科目id|
|»» name|body|string| yes |沖帳項目名稱|
|»» amount|body|integer| yes |沖帳金額|

> Response Examples

> 200 Response

```json
{
    "data": {
        "counterpartyUuid": "301b53f8-1b59-4ecc-8836-ba6673e6baa7",
        "settleAmount": 800,
        "paymentAmount": 750,
        "affectedCount": 4,
        "totalBeforeRemaining": 975,
        "settlementLedgerUuid": "1cdd4713-6973-40a7-bf50-22c4badb316b",
        "settlementOrderCode": "TX-115080500015",
        "settleEventUuid": "47d51dbe-0fd2-4612-ad04-5a20ec8bcb4d",
        "allocations": [
            {
                "feeAmount": 30,
                "name": "匯總手續費",
                "settlementLedgerUuid": "ce93dcb8-11d5-4a5f-a17f-756e5c6f205b",
                "orderCode": "TX-115080500016",
                "relationUuid": "bd654351-f569-4d83-9c61-e7a4c322c566"
            }
        ],
        "otherDeductions": [
            {
                "officialAccountingSubjectId": 30,
                "amount": 20,
                "name": "雜費",
                "settlementLedgerUuid": "431ebae0-c78f-48cd-8129-e34d91d3869a",
                "orderCode": "TX-115080500017",
                "relationUuid": "5e321f56-a4b5-4717-821b-e1d663de3566"
            }
        ],
        "ledgerAllocations": [
            {
                "ledgerUuid": "9b435670-0281-4a26-b23d-743845b56323",
                "orderCode": "TX-115072900003",
                "transactionDate": "2026-07-29T00:00:00Z",
                "beforeRemaining": 30,
                "settleAmount": 30,
                "paymentAmount": 30,
                "feeAmount": 0,
                "deductionAmount": 0,
                "afterRemaining": 0,
                "settlementStatus": 0,
                "settlementLedgerUuid": "1cdd4713-6973-40a7-bf50-22c4badb316b",
                "settlementOrderCode": "TX-115080500015",
                "relationUuid": "e4cbed06-627b-4907-9a61-ffa791126b01",
                "closed": true
            },
            {
                "ledgerUuid": "bb68bbc4-6e00-4a8f-8f9d-891d16487771",
                "orderCode": "TX-115080500002",
                "transactionDate": "2026-08-05T00:00:00Z",
                "beforeRemaining": 210,
                "settleAmount": 210,
                "paymentAmount": 210,
                "feeAmount": 0,
                "deductionAmount": 0,
                "afterRemaining": 0,
                "settlementStatus": 0,
                "settlementLedgerUuid": "1cdd4713-6973-40a7-bf50-22c4badb316b",
                "settlementOrderCode": "TX-115080500015",
                "relationUuid": "77687b32-bcfa-4dfe-a9d7-b8fc61c038d7",
                "closed": true
            },
            {
                "ledgerUuid": "4c59853a-89c6-4973-9261-f6db0b3a4a5c",
                "orderCode": "TX-115080500003",
                "transactionDate": "2026-08-05T00:00:00Z",
                "beforeRemaining": 315,
                "settleAmount": 315,
                "paymentAmount": 315,
                "feeAmount": 0,
                "deductionAmount": 0,
                "afterRemaining": 0,
                "settlementStatus": 0,
                "settlementLedgerUuid": "1cdd4713-6973-40a7-bf50-22c4badb316b",
                "settlementOrderCode": "TX-115080500015",
                "relationUuid": "343d0ba7-a55b-432e-8432-c1497098ea28",
                "closed": true
            },
            {
                "ledgerUuid": "f0b88dba-8b8e-4d4e-a44c-a06ada541c66",
                "orderCode": "TX-115080500004",
                "transactionDate": "2026-08-05T00:00:00Z",
                "beforeRemaining": 420,
                "settleAmount": 245,
                "paymentAmount": 195,
                "feeAmount": 30,
                "deductionAmount": 20,
                "afterRemaining": 175,
                "settlementStatus": 2,
                "settlementLedgerUuid": "1cdd4713-6973-40a7-bf50-22c4badb316b",
                "settlementOrderCode": "TX-115080500015",
                "relationUuid": "df4281d0-39b7-4ae0-9b21-32936c50ac83",
                "closed": false
            }
        ],
        "paymentDate": "20260805",
        "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2"
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» paymentDate|string|true|none||付款日 YYYYMMDD|
|» bankAccountUuid|string|true|none||付款戶頭|
|» counterpartyUuid|string|false|none||廠商 uuid|
|» settleAmount|integer|true|none||匯總沖帳總額|
|» appliedSettleAmount|integer|true|none||實際沖到原單的合計|
|» paymentAmount|integer|true|none||實際銀行付出|
|» actualPaymentAmount|integer|true|none||實際銀行付出|
|» balanceBefore|integer|true|none||沖前廠商餘額|
|» balanceAfter|integer|true|none||沖後廠商餘額|
|» isBalance|boolean|true|none||是否將超沖少沖的金額記進餘額|
|» affectedCount|integer|true|none||有沖帳的原單筆數|
|» totalBeforeRemaining|integer|true|none||沖前剩餘合計|
|» settlementLedgerUuid|string|true|none||唯一匯總結算帳uuid|
|» settlementOrderCode|string|true|none||交易編號|
|» allocations|[object]|true|none||none|
|»» ledgerUuid|string|true|none||結算帳uuid|
|»» orderCode|string|true|none||交易編號|
|»» transactionDate|string¦null|false|none||none|
|»» beforeRemaining|integer|true|none||none|
|»» settleAmount|integer|true|none||none|
|»» afterRemaining|integer|true|none||none|
|»» settlementStatus|integer|true|none||0平衡 1超沖 2少沖|
|»» settlementLedgerUuid|string|false|none||結算傳票 uuid（alloc>0 才有）|
|»» settlementOrderCode|string|false|none||結算傳票編號|
|»» relationUuid|string|false|none||沖帳關聯 uuid|
|»» closed|boolean|true|none||none|

## POST 銷項匯總沖帳預覽

POST /ael/ledger/reconciliation/receivables/settle/preview

銷項匯總沖帳預覽

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
    "settleAmount": 30300,
    "depositAmount": 30000,
    "isBalance": true,
    "allocations": {
        "feeAmount": 200,
        "name": "匯總手續費"
    },
    "otherDeductions": [
        {
            "officialAccountingSubjectId": 30,
            "amount": 100,
            "name": "雜費"
        }
    ]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司 UUID|
|» paymentChannelUuid|body|string| yes |銷售管道uuid|
|» isDefault|body|boolean| yes |使用預設預覽嗎|
|» ledgerUuids|body|[string]| yes |要預覽匯總沖帳的自選 uuid 列表|
|» settleAmount|body|integer| yes |本次匯總沖帳總額（元）；依 transaction_date／created_at 由舊到新拆帳，超沖加在最後一筆|
|» depositAmount|body|integer| yes |銷項實際存入|
|» balanceUsed|body|integer| yes |使用餘額|
|» isBalance|body|boolean| yes |是否將超沖少沖的金額記進餘額|
|» allocations|body|object| yes |沖帳手續費物件|
|»» feeAmount|body|integer| yes |手續費|
|»» name|body|string| yes |沖帳項目名稱|
|» otherDeductions|body|[object]| yes |none|
|»» officialAccountingSubjectId|body|integer| yes |科目id|
|»» name|body|string| yes |沖帳項目名稱|
|»» amount|body|integer| yes |沖帳金額|

> Response Examples

> 200 Response

```json
{
    "data": {
        "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
        "settleAmount": 30300,
        "depositAmount": 30000,
        "affectedCount": 4,
        "totalBeforeRemaining": 31045,
        "allocations": [
            {
                "feeAmount": 200,
                "name": "匯總手續費",
                "settlementLedgerUuid": "",
                "orderCode": "",
                "relationUuid": ""
            }
        ],
        "otherDeductions": [
            {
                "officialAccountingSubjectId": 30,
                "amount": 100,
                "name": "雜費",
                "settlementLedgerUuid": "",
                "orderCode": "",
                "relationUuid": ""
            }
        ],
        "ledgerAllocations": [
            {
                "ledgerUuid": "75934159-4bf4-4b24-8e68-3f76248d40a1",
                "orderCode": "TX-115073100004",
                "transactionDate": "2026-07-17T00:00:00Z",
                "beforeRemaining": 30000,
                "settleAmount": 30000,
                "paymentAmount": 30000,
                "feeAmount": 0,
                "deductionAmount": 0,
                "afterRemaining": 0,
                "settlementStatus": 0,
                "closed": true
            },
            {
                "ledgerUuid": "0190bf3a-3716-4a74-9694-2bec305d7b48",
                "orderCode": "TX-115080300010",
                "transactionDate": "2026-08-01T00:00:00Z",
                "beforeRemaining": 50,
                "settleAmount": 50,
                "paymentAmount": 0,
                "feeAmount": 50,
                "deductionAmount": 0,
                "afterRemaining": 0,
                "settlementStatus": 0,
                "closed": true
            },
            {
                "ledgerUuid": "f2cb960e-6aac-4b85-8ae6-3133ae86b9f4",
                "orderCode": "TX-115080300003",
                "transactionDate": "2026-08-03T00:00:00Z",
                "beforeRemaining": 50,
                "settleAmount": 50,
                "paymentAmount": 0,
                "feeAmount": 50,
                "deductionAmount": 0,
                "afterRemaining": 0,
                "settlementStatus": 0,
                "closed": true
            },
            {
                "ledgerUuid": "636f9e81-4f38-4490-8ad0-b57304ca0336",
                "orderCode": "TX-115080500006",
                "transactionDate": "2026-08-05T00:00:00Z",
                "beforeRemaining": 210,
                "settleAmount": 200,
                "paymentAmount": 0,
                "feeAmount": 100,
                "deductionAmount": 100,
                "afterRemaining": 10,
                "settlementStatus": 2,
                "closed": false
            }
        ]
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» paymentChannelUuid|string|false|none||銷售管道 uuid|
|»» settleAmount|integer|true|none||本次匯總沖帳總額（元）|
|»» appliedSettleAmount|integer|true|none||實際沖到原單合計金額|
|»» depositAmount|integer|true|none||實際異動銀行金額|
|»» actualDepositAmount|integer|true|none||實際異動銀行金額|
|»» balanceBefore|integer|true|none||沖前銷售管道餘額|
|»» balanceAfter|integer|true|none||沖後銷售管道餘額|
|»» isBalance|boolean|true|none||是否將超沖少沖的金額記進餘額|
|»» affectedCount|integer|true|none||實際有分配金額（alloc>0）的原單筆數|
|»» totalBeforeRemaining|integer|true|none||拆帳前各原單 remaining 合計|
|»» allocations|[object]|true|none||各原單拆帳結果（無結算 uuid）|
|»»» feeAmount|integer|false|none||手續費|
|»»» name|string|false|none||名稱|
|»»» settlementLedgerUuid|string|false|none||none|
|»»» orderCode|string|false|none||原單交易編號|
|»»» relationUuid|string|false|none||none|
|»» otherDeductions|[object]|true|none||none|
|»»» officialAccountingSubjectId|integer|false|none||科目 id|
|»»» amount|integer|false|none||金額|
|»»» name|string|false|none||名稱|
|»»» settlementLedgerUuid|string|false|none||none|
|»»» orderCode|string|false|none||原單交易編號|
|»»» relationUuid|string|false|none||none|
|»» ledgerAllocations|[object]|true|none||none|
|»»» ledgerUuid|string|true|none||none|
|»»» orderCode|string|true|none||none|
|»»» transactionDate|string|true|none||none|
|»»» beforeRemaining|integer|true|none||none|
|»»» settleAmount|integer|true|none||none|
|»»» paymentAmount|integer|true|none||none|
|»»» feeAmount|integer|true|none||none|
|»»» deductionAmount|integer|true|none||none|
|»»» afterRemaining|integer|true|none||none|
|»»» settlementStatus|integer|true|none||none|
|»»» closed|boolean|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## POST 銷項匯總沖帳

POST /ael/ledger/reconciliation/receivables/settle/summary

銷項匯總沖帳
isBalance=true的話，depositAmount要放實際沖完整的那幾筆金額總和（預覽會傳）

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "ledgerUuids": [
        "75934159-4bf4-4b24-8e68-3f76248d40a1",
        "636f9e81-4f38-4490-8ad0-b57304ca0336",
        "f2cb960e-6aac-4b85-8ae6-3133ae86b9f4",
        "0190bf3a-3716-4a74-9694-2bec305d7b48"
    ],
    "settleAmount": 30300,
    "depositAmount": 30000,
    "paymentDate": "20260805",
    "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
    "memo": "匯總應收測試",
    "allocations": {
        "feeAmount": 200,
        "name": "匯總手續費"
    },
    "otherDeductions": [
        {
            "officialAccountingSubjectId": 30,
            "amount": 100,
            "name": "匯總雜費"
        }
    ]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司 UUID|
|» ledgerUuids|body|[string]| yes |要匯總沖帳的原單 uuid 列表（不可重複；應付須同廠商；應收須同銷售管道）|
|» settleAmount|body|integer| yes |本次匯總沖帳總額（元）|
|» depositAmount|body|integer| yes |銷項實際存入|
|» paymentDate|body|string| yes |付款／收款日 YYYYMMDD,必填|
|» bankAccountUuid|body|string| yes |銀行帳戶 uuid,必填|
|» memo|body|string| no |備註（選填）|
|» balanceUsed|body|integer| yes |使用餘額|
|» allocations|body|object| yes |沖帳手續費物件|
|»» feeAmount|body|integer| yes |手續費|
|»» name|body|string| yes |沖帳項目名稱|
|» otherDeductions|body|[object]| yes |沖帳其他減項物件|
|»» officialAccountingSubjectId|body|integer| yes |科目id|
|»» name|body|string| yes |沖帳項目名稱|
|»» amount|body|integer| yes |沖帳金額|

> Response Examples

> 200 Response

```json
{
    "success": true,
    "errorCode": "0000",
    "message": "操作成功",
    "data": {
        "paymentChannelUuid": "channel-uuid-001",
        "settleAmount": 12000,
        "affectedCount": 2,
        "totalBeforeRemaining": 18000,
        "paymentDate": "20260804",
        "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
        "allocations": [
            {
                "ledgerUuid": "cccccccc-3333-3333-3333-333333333333",
                "orderCode": "TX-115030100001",
                "transactionDate": "2026-03-01",
                "beforeRemaining": 8000,
                "settleAmount": 8000,
                "afterRemaining": 0,
                "settlementStatus": 0,
                "settlementLedgerUuid": "settle-r-1",
                "settlementOrderCode": "TX-115080400010",
                "relationUuid": "rel-r-1",
                "closed": true
            },
            {
                "ledgerUuid": "dddddddd-4444-4444-4444-444444444444",
                "orderCode": "TX-115030500002",
                "transactionDate": "2026-03-05",
                "beforeRemaining": 10000,
                "settleAmount": 4000,
                "afterRemaining": 6000,
                "settlementStatus": 2,
                "settlementLedgerUuid": "settle-r-2",
                "settlementOrderCode": "TX-115080400011",
                "relationUuid": "rel-r-2",
                "closed": false
            }
        ]
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» paymentDate|string|true|none||付款日 YYYYMMDD|
|» bankAccountUuid|string|true|none||付款戶頭|
|» paymentChannelUuid|string|true|none||銷售管道 uuid|
|» settleAmount|integer|true|none||匯總沖帳總額|
|» appliedSettleAmount|integer|true|none||實際沖到原單的合計|
|» depositAmount|integer|true|none||實際銀行存入|
|» actualDepositAmount|integer|true|none||實際銀行存入|
|» balanceBefore|integer|true|none||沖前銷售管道餘額|
|» balanceAfter|integer|true|none||沖後銷售管道餘額|
|» isBalance|boolean|true|none||是否將超沖少沖的金額記進餘額|
|» affectedCount|integer|true|none||有沖帳的原單筆數|
|» totalBeforeRemaining|integer|true|none||沖前剩餘合計|
|» settlementLedgerUuid|string|true|none||唯一匯總結算帳uuid|
|» settlementOrderCode|string|true|none||交易編號|
|» allocations|[object]|true|none||none|
|»» ledgerUuid|string|true|none||結算帳uuid|
|»» orderCode|string|true|none||交易編號|
|»» transactionDate|string¦null|false|none||none|
|»» beforeRemaining|integer|true|none||none|
|»» settleAmount|integer|true|none||none|
|»» afterRemaining|integer|true|none||none|
|»» settlementStatus|integer|true|none||0平衡 1超沖 2少沖|
|»» settlementLedgerUuid|string|false|none||結算傳票 uuid（alloc>0 才有）|
|»» settlementOrderCode|string|false|none||結算傳票編號|
|»» relationUuid|string|false|none||沖帳關聯 uuid|
|»» closed|boolean|true|none||none|

## POST 恢復手動沖帳紀錄

POST /ael/ledger/settle/reverse

撤銷手動沖帳紀錄

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "settleEventUuid": "13347dbc-6acc-417b-9f77-8001babe4e4c"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |none|
|» settleEventUuid|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 恢復發票即沖的沖帳紀錄

POST /ael/ledger/invoiceSettle/reverse

恢復發票即沖的沖帳紀錄

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "settleEventUuid": ""
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |none|
|» settleEventUuid|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 恢復匯總沖帳紀錄

POST /ael/ledger/reconciliation/settle/reverse

撤銷匯總沖帳紀錄

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "settleEventUuid": "13347dbc-6acc-417b-9f77-8001babe4e4c"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |none|
|» settleEventUuid|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET 依沖帳事件查關聯交易

GET /ael/ledger/settle/event

依沖帳事件settleEventUuid查關聯交易ledgerUuid

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|companyUuid|query|string| no |公司uuid|
|settleEventUuid|query|string| no |沖帳事件uuid|

> Response Examples

> 200 Response

```json
{
    "data": {
        "settleEventUuid": "fbfe7e59-345e-46b9-81eb-5727a0fad06b",
        "reconMethod": 2,
        "side": 0,
        "paymentDate": "20260811",
        "settleAmount": 525,
        "cashAmount": 525,
        "isReverse": false,
        "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
        "mainSettlementLedgerUuid": "7da59c26-53fa-4c5f-975a-afe5d17fe58e",
        "originLedgerUuids": [
            "52d17953-4952-4de4-9322-88f414abd61d",
            "636f9e81-4f38-4490-8ad0-b57304ca0336"
        ],
        "feeLedgerUuids": [],
        "deductionLedgerUuids": []
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|false|none||none|
|» errorCode|string|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|
|»» settleEventUuid|string|false|none||沖帳事件uuid|
|»» reconMethod|integer|false|none||0手動／1即沖／2匯總／4銀行提匯等|
|»» side|integer|false|none||0銷項／1進項|
|»» paymentDate|string|false|none||YYYYMMDD|
|»» settleAmount|integer|false|none||沖帳金額|
|»» cashAmount|integer|false|none||實際現金異動|
|»» isReverse|boolean|false|none||是恢復交易嗎|
|»» bankAccountUuid|string¦null|false|none||銀行帳號uuid|
|»» mainSettlementLedgerUuid|string|false|none||主結算交易uuid|
|»» originLedgerUuids|[string]|false|none||業務原單交易uuid|
|»» feeLedgerUuids|[string]|false|none||手續費交易uuid|
|»» deductionLedgerUuids|[string]|false|none||其他減項交易uuid|

# 帳簿/對帳中心

## GET 拿取該公司的所有進項應付，依廠商分組列表

GET /ael/ledger/reconciliation/payables

拿取該公司的所有進項應付，依廠商分組列表，目前會全撈，含已結清超沖少沖。時間上搜尋目前只能搜尋今年跟去年的

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|companyUuid|query|string| yes |公司uuid|
|year|query|string| no |西元年|
|dateFrom|query|string| no |日期起，	YYYYMMDD|
|dateTo|query|string| no |日期迄，	YYYYMMDD|
|counterpartyUuid|query|string| no |廠商uuid|
|settled|query|string| no |true=已結清、false=未結清、省略=全部|

> Response Examples

> 200 Response

```json
{
    "data": [
        {
            "groupKey": "uuid:301b53f8-1b59-4ecc-8836-ba6673e6baa7",
            "isVendor": true,
            "counterpartyUuid": "301b53f8-1b59-4ecc-8836-ba6673e6baa7",
            "counterpartyName": "和興商店",
            "vendor": {
                "bankAccountUuid": "301b53f8-1b59-4ecc-8836-ba6673e6baa7",
                "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
                "taxId": "61194605",
                "name": "和興商店",
                "registeredAddress": "南投縣中寮鄉中寮村鄉林巷４３號",
                "bankAccountName": "和興商店",
                "bankCode": "822",
                "bankName": "中國信託",
                "branchName": "港墘分行",
                "accountNo": "5555666677778888",
                "isActive": true,
                "remark": "TEST2",
                "createdAt": "2026-07-29T08:40:08Z",
                "updatedAt": "2026-07-29T08:40:08Z"
            },
            "totalSettledAmount": 180,
            "totalRemainingAmount": 30,
            "settlementStatus": 2,
            "items": [
                {
                    "ledgerUuid": "9b435670-0281-4a26-b23d-743845b56323",
                    "orderCode": "TX-115072900003",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 3,
                    "counterpartyName": "和興商店",
                    "counterpartyUuid": "301b53f8-1b59-4ecc-8836-ba6673e6baa7",
                    "totalAmount": 210,
                    "netAmount": 200,
                    "taxAmount": 10,
                    "taxFreeAmount": 0,
                    "settledAmount": 180,
                    "remainingAmount": 30,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 10,
                    "createdAt": "2026-07-29T09:10:03Z"
                }
            ]
        }
    ],
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[object]|true|none||none|
|»» groupKey|string|false|none||none|
|»» isVendor|boolean|false|none||none|
|»» counterpartyUuid|string|false|none||none|
|»» counterpartyName|string|false|none||none|
|»» vendor|object|false|none||none|
|»»» bankAccountUuid|string|true|none||none|
|»»» companyUuid|string|true|none||none|
|»»» taxId|string|true|none||none|
|»»» name|string|true|none||none|
|»»» registeredAddress|string|true|none||none|
|»»» bankAccountName|string|true|none||none|
|»»» bankCode|string|true|none||none|
|»»» bankName|string|true|none||none|
|»»» branchName|string|true|none||none|
|»»» accountNo|string|true|none||none|
|»»» balance|integer|true|none||餘額|
|»»» isActive|boolean|true|none||none|
|»»» remark|string|true|none||none|
|»»» createdAt|string|true|none||none|
|»»» updatedAt|string|true|none||none|
|»» balance|integer|true|none||餘額|
|»» totalSettledAmount|integer|false|none||none|
|»» totalRemainingAmount|integer|false|none||none|
|»» settlementStatus|integer|false|none||none|
|»» items|[object]|false|none||none|
|»»» ledgerUuid|string|false|none||none|
|»»» orderCode|string|false|none||none|
|»»» entryDate|null|false|none||none|
|»»» direction|integer|false|none||none|
|»»» counterpartyName|string|false|none||none|
|»»» counterpartyUuid|string|false|none||none|
|»»» totalAmount|integer|false|none||none|
|»»» netAmount|integer|false|none||none|
|»»» taxAmount|integer|false|none||none|
|»»» taxFreeAmount|integer|false|none||none|
|»»» settledAmount|integer|false|none||none|
|»»» remainingAmount|integer|false|none||none|
|»»» settlementStatus|integer|false|none||none|
|»»» officialAccountingSubjectId|integer|false|none||none|
|»»» createdAt|string|false|none||none|
|»»» invoice|[object]|true|none||none|
|»»»» uuid|string|true|none||發票uuid|
|»»»» invoiceTrack|string|true|none||發票字軌|
|»»»» invoiceNumber|string|true|none||發票號碼|
|»»»» voucherNumber|string|true|none||發票字軌+發票號碼|
|»»»» date|string|true|none||YYYMMDD|
|»»»» buyerName|string|true|none||買方名稱|
|»»»» sellerName|string|true|none||賣方名稱|
|»»»» buyerTaxIdNumber|string|true|none||買方統編|
|»»»» sellerTaxIdNumber|string|true|none||賣方統編|
|»»»» counterpartyTaxId|string|true|none||廠商統編|
|»»»» amount|integer|true|none||未稅額|
|»»»» businessTax|integer|true|none||稅額|
|»»»» buyOrSell|integer|true|none||2進項,3銷項|
|»»»» ourInvoiceType|integer|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## GET 拿取該公司的所有銷項應收，依銷售管道分組列表

GET /ael/ledger/reconciliation/receivables

拿取該公司的所有銷項應收，依銷售管道分組列表，目前會全撈，含已結清超沖少沖。時間上搜尋目前只能搜尋今年跟去年的

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|companyUuid|query|string| no |公司uuid|
|year|query|string| no |西元年|
|dateFrom|query|string| no |日期起，	YYYYMMDD|
|dateTo|query|string| no |日期迄，	YYYYMMDD|
|paymentChannelUuid|query|string| no |銷售管道uuid|
|settled|query|string| no |true=已結清、false=未結清、省略=全部|

> Response Examples

> 200 Response

```json
{
    "data": [
        {
            "groupKey": "channel:5900d3b6-d6b3-4075-92ad-890aee377301",
            "hasChannel": true,
            "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
            "channelName": "蝦皮",
            "channel": {
                "channelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
                "channelName": "蝦皮",
                "receivingAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
                "settlementStyle": 0,
                "settlementAmount": 7,
                "feeRateBps": 200,
                "feeFixedAmount": 3,
                "balance": 43,
                "isActive": true,
                "remark": "2.00%+3元",
                "createdAt": "2026-07-30T08:41:19Z",
                "updatedAt": "2026-08-12T04:27:45Z"
            },
            "receivingAccount": {
                "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
                "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
                "accountName": "測試帳戶改",
                "bankCode": "822",
                "bankName": "中國信託",
                "branchName": "港墘分行",
                "accountNo": "1234567890123456",
                "currentBalance": 301618,
                "lastBalanceUpdateDate": "20260813",
                "isDefaultReceivingAccount": true,
                "isDefaultPaymentAccount": true,
                "isActive": true,
                "remark": "前端自動化測試備註",
                "createdAt": "2026-07-30T04:17:46Z",
                "updatedAt": "2026-08-13T04:25:21Z"
            },
            "balance": 43,
            "totalSettledAmount": 5000,
            "totalRemainingAmount": 811029,
            "settlementStatus": 2,
            "items": [
                {
                    "ledgerUuid": "f2ab9a2e-8cf0-43b7-89c4-29c2d4fc38a7",
                    "orderCode": "TX-115073100008",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "潤智教育有限公司",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 30000,
                    "netAmount": 30000,
                    "taxAmount": 0,
                    "taxFreeAmount": 0,
                    "settledAmount": 5000,
                    "remainingAmount": 25000,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 1,
                    "createdAt": "2026-07-31T08:45:29Z",
                    "invoice": {
                        "uuid": "029a4783-9767-4d0e-80bd-8305a6b46538",
                        "invoiceTrack": "RR",
                        "invoiceNumber": "56000000",
                        "voucherNumber": "RR56000000",
                        "date": "1150701",
                        "amount": 30000,
                        "businessTax": 0,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "95441885",
                        "buyerTaxIdNumber": "95441885",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "潤智教育有限公司",
                        "sellerName": "盤古投資有限公司"
                    }
                },
                {
                    "ledgerUuid": "b2d3e3c7-0c62-414e-a0ad-9a04a30d865b",
                    "orderCode": "TX-115080700039",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "測試測試",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 46490,
                    "netAmount": 43000,
                    "taxAmount": 3490,
                    "taxFreeAmount": 0,
                    "settledAmount": 0,
                    "remainingAmount": 46490,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 10,
                    "createdAt": "2026-08-07T07:59:08Z",
                    "invoice": {
                        "uuid": "6e0ece6d-4f7c-400e-9c14-c9924775b9c3",
                        "invoiceTrack": "EI",
                        "invoiceNumber": "34234234",
                        "voucherNumber": "EI34234234",
                        "date": "1150707",
                        "amount": 46490,
                        "businessTax": 3490,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "40343490",
                        "buyerTaxIdNumber": "40343490",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "測試測試",
                        "sellerName": "盤古投資有限公司"
                    }
                },
                {
                    "ledgerUuid": "44026f3e-4eba-4376-8f44-ecc125e82876",
                    "orderCode": "TX-115073100005",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "潤智教育有限公司",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 5040,
                    "netAmount": 4000,
                    "taxAmount": 40,
                    "taxFreeAmount": 1000,
                    "settledAmount": 0,
                    "remainingAmount": 5040,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 1,
                    "createdAt": "2026-07-31T07:06:51Z",
                    "invoice": {
                        "uuid": "1a4b0bd9-3ad4-4966-866f-2d000dc2251d",
                        "invoiceTrack": "HH",
                        "invoiceNumber": "60889000",
                        "voucherNumber": "HH60889000",
                        "date": "1150710",
                        "amount": 5040,
                        "businessTax": 40,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "95441885",
                        "buyerTaxIdNumber": "95441885",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "潤智教育有限公司",
                        "sellerName": "盤古投資有限公司"
                    }
                },
                {
                    "ledgerUuid": "f26bc332-2d45-405e-b993-8f31fa1d0290",
                    "orderCode": "TX-115080700042",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "測試測試",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 312240,
                    "netAmount": 309200,
                    "taxAmount": 3040,
                    "taxFreeAmount": 0,
                    "settledAmount": 0,
                    "remainingAmount": 312240,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 10,
                    "createdAt": "2026-08-07T08:00:57Z",
                    "invoice": {
                        "uuid": "a69f9dcb-feb6-4980-995c-112ff671e4cb",
                        "invoiceTrack": "ER",
                        "invoiceNumber": "24024903",
                        "voucherNumber": "ER24024903",
                        "date": "1150801",
                        "amount": 312240,
                        "businessTax": 3040,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "49030034",
                        "buyerTaxIdNumber": "49030034",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "測試測試",
                        "sellerName": "盤古投資有限公司"
                    }
                },
                {
                    "ledgerUuid": "5603d33c-d301-4b10-9c45-f664bec4a11e",
                    "orderCode": "TX-115080700047",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "測試測試",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 3454,
                    "netAmount": 3424,
                    "taxAmount": 30,
                    "taxFreeAmount": 0,
                    "settledAmount": 0,
                    "remainingAmount": 3454,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 1,
                    "createdAt": "2026-08-07T08:03:35Z",
                    "invoice": {
                        "uuid": "2d051b3d-52f8-40fa-a46e-25d93d60d033",
                        "invoiceTrack": "OE",
                        "invoiceNumber": "32434333",
                        "voucherNumber": "OE32434333",
                        "date": "1150801",
                        "amount": 3454,
                        "businessTax": 30,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "34293234",
                        "buyerTaxIdNumber": "34293234",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "測試測試",
                        "sellerName": "盤古投資有限公司"
                    }
                },
                {
                    "ledgerUuid": "da6c16f7-e7d1-47a5-b4b0-d776c2cfd928",
                    "orderCode": "TX-115080700041",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "測試測試",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 3434,
                    "netAmount": 3400,
                    "taxAmount": 34,
                    "taxFreeAmount": 0,
                    "settledAmount": 0,
                    "remainingAmount": 3434,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 10,
                    "createdAt": "2026-08-07T08:00:28Z",
                    "invoice": {
                        "uuid": "d362defc-2e1e-4a36-9dfe-79f7e68fb1c5",
                        "invoiceTrack": "PE",
                        "invoiceNumber": "34889234",
                        "voucherNumber": "PE34889234",
                        "date": "1150803",
                        "amount": 3434,
                        "businessTax": 34,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "34892343",
                        "buyerTaxIdNumber": "34892343",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "測試測試",
                        "sellerName": "盤古投資有限公司"
                    }
                },
                {
                    "ledgerUuid": "3b89af58-f323-4f76-84eb-6ef24ac80ef0",
                    "orderCode": "TX-115080700035",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "測試公司一",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 300000,
                    "netAmount": 300000,
                    "taxAmount": 0,
                    "taxFreeAmount": 0,
                    "settledAmount": 0,
                    "remainingAmount": 300000,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 10,
                    "createdAt": "2026-08-07T07:56:33Z",
                    "invoice": {
                        "uuid": "c0aa04e6-995d-4d81-968b-292af4c9f53a",
                        "invoiceTrack": "OO",
                        "invoiceNumber": "32340000",
                        "voucherNumber": "OO32340000",
                        "date": "1150804",
                        "amount": 300000,
                        "businessTax": 0,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "32481939",
                        "buyerTaxIdNumber": "32481939",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "測試公司一",
                        "sellerName": "盤古投資有限公司"
                    }
                },
                {
                    "ledgerUuid": "c9cf71a4-aafc-498c-bbd3-081c6b2785b1",
                    "orderCode": "TX-115080700045",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "測試測試",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 53429,
                    "netAmount": 49999,
                    "taxAmount": 3430,
                    "taxFreeAmount": 0,
                    "settledAmount": 0,
                    "remainingAmount": 53429,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 10,
                    "createdAt": "2026-08-07T08:02:34Z",
                    "invoice": {
                        "uuid": "e44210d2-b0aa-4d94-9249-9726b8698c60",
                        "invoiceTrack": "RU",
                        "invoiceNumber": "43449343",
                        "voucherNumber": "RU43449343",
                        "date": "1150804",
                        "amount": 53429,
                        "businessTax": 3430,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "34034243",
                        "buyerTaxIdNumber": "34034243",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "測試測試",
                        "sellerName": "盤古投資有限公司"
                    }
                },
                {
                    "ledgerUuid": "a10f2060-01d8-48b1-b26a-cbce12caaece",
                    "orderCode": "TX-115080600009",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "測試買家C",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 0,
                    "netAmount": 100,
                    "taxAmount": 0,
                    "taxFreeAmount": 0,
                    "settledAmount": 0,
                    "remainingAmount": 0,
                    "settlementStatus": 0,
                    "officialAccountingSubjectId": 1,
                    "createdAt": "2026-08-06T09:16:47Z",
                    "invoice": {
                        "uuid": "ac4ba738-a92b-4f48-a70a-b8f680ffb0c1",
                        "invoiceTrack": "99",
                        "invoiceNumber": "900003",
                        "voucherNumber": "99900003",
                        "date": "1150806",
                        "amount": 0,
                        "businessTax": 0,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "",
                        "buyerTaxIdNumber": "",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "測試買家C",
                        "sellerName": "盤古投資有限公司"
                    }
                },
                {
                    "ledgerUuid": "a781b07d-4127-4055-b5cc-680f55daf985",
                    "orderCode": "TX-115080700037",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "測試二二二",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 43730,
                    "netAmount": 40300,
                    "taxAmount": 3430,
                    "taxFreeAmount": 0,
                    "settledAmount": 0,
                    "remainingAmount": 43730,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 1,
                    "createdAt": "2026-08-07T07:58:21Z",
                    "invoice": {
                        "uuid": "27d89a2e-0058-4ffc-80b3-5d343bf28652",
                        "invoiceTrack": "ER",
                        "invoiceNumber": "34342483",
                        "voucherNumber": "ER34342483",
                        "date": "1150806",
                        "amount": 43730,
                        "businessTax": 3430,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "42834343",
                        "buyerTaxIdNumber": "42834343",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "測試二二二",
                        "sellerName": "盤古投資有限公司"
                    }
                },
                {
                    "ledgerUuid": "ac93b74f-9861-404b-a417-df2e021e9c24",
                    "orderCode": "TX-115080700017",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "測試買家二",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 2100,
                    "netAmount": 2000,
                    "taxAmount": 100,
                    "taxFreeAmount": 0,
                    "settledAmount": 0,
                    "remainingAmount": 2100,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 1,
                    "createdAt": "2026-08-07T04:21:58Z",
                    "invoice": {
                        "uuid": "42d57d54-284e-4263-ab37-9d3aae591223",
                        "invoiceTrack": "AB",
                        "invoiceNumber": "10000002",
                        "voucherNumber": "AB10000002",
                        "date": "1150807",
                        "amount": 2100,
                        "businessTax": 100,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "",
                        "buyerTaxIdNumber": "",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "測試買家二",
                        "sellerName": "盤古投資有限公司"
                    }
                },
                {
                    "ledgerUuid": "986cedb4-1f69-40fc-94a4-e2f71d140503",
                    "orderCode": "TX-115080700018",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "測試買家三",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 3150,
                    "netAmount": 3000,
                    "taxAmount": 150,
                    "taxFreeAmount": 0,
                    "settledAmount": 0,
                    "remainingAmount": 3150,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 1,
                    "createdAt": "2026-08-07T04:23:02Z",
                    "invoice": {
                        "uuid": "f3e07762-efa0-4b37-89e6-f92b5b3a3549",
                        "invoiceTrack": "AB",
                        "invoiceNumber": "10000003",
                        "voucherNumber": "AB10000003",
                        "date": "1150807",
                        "amount": 3150,
                        "businessTax": 150,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "",
                        "buyerTaxIdNumber": "",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "測試買家三",
                        "sellerName": "盤古投資有限公司"
                    }
                },
                {
                    "ledgerUuid": "0b33c141-c694-40e1-b899-97bb42218dbd",
                    "orderCode": "TX-115080700038",
                    "entryDate": null,
                    "entryKind": 0,
                    "direction": 2,
                    "counterpartyName": "測試客戶一",
                    "paymentChannelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
                    "totalAmount": 12962,
                    "netAmount": 12345,
                    "taxAmount": 617,
                    "taxFreeAmount": 0,
                    "settledAmount": 0,
                    "remainingAmount": 12962,
                    "settlementStatus": 2,
                    "officialAccountingSubjectId": 1,
                    "createdAt": "2026-08-07T07:59:04Z",
                    "invoice": {
                        "uuid": "66aa3c2e-108c-4808-a019-f48a00a829ad",
                        "invoiceTrack": "AB",
                        "invoiceNumber": "10000001",
                        "voucherNumber": "AB10000001",
                        "date": "1150811",
                        "amount": 12962,
                        "businessTax": 617,
                        "buyOrSell": 3,
                        "ourInvoiceType": 3,
                        "counterpartyTaxId": "",
                        "buyerTaxIdNumber": "",
                        "sellerTaxIdNumber": "82999614",
                        "buyerName": "測試客戶一",
                        "sellerName": "盤古投資有限公司"
                    }
                }
            ]
        }
    ],
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[object]|true|none||none|
|»» groupKey|string|false|none||none|
|»» hasChannel|boolean|false|none||none|
|»» paymentChannelUuid|string|false|none||none|
|»» channelName|string|false|none||none|
|»» channel|object|false|none||none|
|»»» channelUuid|string|true|none||none|
|»»» companyUuid|string|true|none||none|
|»»» channelName|string|true|none||none|
|»»» receivingAccountUuid|string|true|none||none|
|»»» settlementStyle|integer|true|none||none|
|»»» settlementAmount|integer|true|none||none|
|»»» feeRateBps|integer|true|none||none|
|»»» feeFixedAmount|integer|true|none||none|
|»»» balance|integer|true|none||none|
|»»» isActive|boolean|true|none||none|
|»»» remark|string|true|none||none|
|»»» createdAt|string|true|none||none|
|»»» updatedAt|string|true|none||none|
|»» receivingAccount|object|false|none||none|
|»»» bankAccountUuid|string|true|none||none|
|»»» companyUuid|string|true|none||none|
|»»» accountName|string|true|none||none|
|»»» bankCode|string|true|none||none|
|»»» bankName|string|true|none||none|
|»»» branchName|string|true|none||none|
|»»» accountNo|string|true|none||none|
|»»» currentBalance|integer|true|none||none|
|»»» lastBalanceUpdateDate|string|true|none||none|
|»»» isDefaultReceivingAccount|boolean|true|none||none|
|»»» isDefaultPaymentAccount|boolean|true|none||none|
|»»» isActive|boolean|true|none||none|
|»»» remark|string|true|none||none|
|»»» createdAt|string|true|none||none|
|»»» updatedAt|string|true|none||none|
|»» balance|integer|false|none||none|
|»» totalSettledAmount|integer|false|none||none|
|»» totalRemainingAmount|integer|false|none||none|
|»» settlementStatus|integer|false|none||none|
|»» items|[object]|false|none||none|
|»»» ledgerUuid|string|true|none||none|
|»»» orderCode|string|true|none||none|
|»»» entryDate|null|true|none||none|
|»»» entryKind|integer|true|none||none|
|»»» direction|integer|true|none||none|
|»»» counterpartyName|string|true|none||none|
|»»» paymentChannelUuid|string|true|none||none|
|»»» totalAmount|integer|true|none||none|
|»»» netAmount|integer|true|none||none|
|»»» taxAmount|integer|true|none||none|
|»»» taxFreeAmount|integer|true|none||none|
|»»» settledAmount|integer|true|none||none|
|»»» remainingAmount|integer|true|none||none|
|»»» settlementStatus|integer|true|none||none|
|»»» officialAccountingSubjectId|integer|true|none||none|
|»»» createdAt|string|true|none||none|
|»»» invoice|object|true|none||none|
|»»»» uuid|string|true|none||none|
|»»»» invoiceTrack|string|true|none||none|
|»»»» invoiceNumber|string|true|none||none|
|»»»» voucherNumber|string|true|none||none|
|»»»» date|string|true|none||none|
|»»»» amount|integer|true|none||none|
|»»»» businessTax|integer|true|none||none|
|»»»» buyOrSell|integer|true|none||none|
|»»»» ourInvoiceType|integer|true|none||none|
|»»»» counterpartyTaxId|string|true|none||none|
|»»»» buyerTaxIdNumber|string|true|none||none|
|»»»» sellerTaxIdNumber|string|true|none||none|
|»»»» buyerName|string|true|none||none|
|»»»» sellerName|string|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

# 日記帳

## POST 產生日記帳

POST /ael/ledger/daily/excel

產生日記帳

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "dateFrom": "20260101",
    "dateTo": "20260808"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司uuid|
|» dateFrom|body|string| yes |日期起，YYYYMMDD|
|» dateTo|body|string| yes |日期迄，YYYYMMDD|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET 拿該筆交易相關的日記帳

GET /ael/ledger/entries/dailyDetail

拿該筆交易相關的日記帳

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|companyUuid|query|string| no |公司uuid|
|ledgerUuid|query|string| no |交易uuid|

> Response Examples

> 200 Response

```json
{
    "data": {
        "ledgerUuid": "ebc326e5-bbc2-4e68-ad2e-b26ed4ca590b",
        "settleEventUuids": [
            "dbb6b55d-f4da-4e8d-be73-4c40dd389025"
        ],
        "lines": [
            {
                "rocYear": "115",
                "voucherNo": "08070019",
                "seq": "",
                "voucherType": "3",
                "rocDate": "1150807",
                "subjectName": "文具用品",
                "counterpartyCode": "",
                "summary": "CD20000001-進貨/費用",
                "debitCredit": "1",
                "amount": 1500,
                "voucherCategory": "",
                "printFlag": "N",
                "taxAmount": "",
                "ledgerUuid": "e198fdaf-fa95-4448-ac8a-03c6056b600c",
                "lineUuid": "339eaf9e-a764-42e0-a33b-ccd7d7b0659e",
                "settleEventUuid": "dbb6b55d-f4da-4e8d-be73-4c40dd389025",
                "isReverse": false,
                "createdDate": "20260807",
                "sortOrder": 1
            },
            {
                "rocYear": "115",
                "voucherNo": "08070019",
                "seq": "",
                "voucherType": "3",
                "rocDate": "1150807",
                "subjectName": "進項稅款",
                "counterpartyCode": "",
                "summary": "CD20000001-進項稅額",
                "debitCredit": "1",
                "amount": 75,
                "voucherCategory": "",
                "printFlag": "N",
                "taxAmount": "",
                "ledgerUuid": "e198fdaf-fa95-4448-ac8a-03c6056b600c",
                "lineUuid": "6b381394-d639-46e2-bafd-9d31aecddc1a",
                "settleEventUuid": "dbb6b55d-f4da-4e8d-be73-4c40dd389025",
                "isReverse": false,
                "createdDate": "20260807",
                "sortOrder": 2
            },
            {
                "rocYear": "115",
                "voucherNo": "08070019",
                "seq": "",
                "voucherType": "3",
                "rocDate": "1150807",
                "subjectName": "應付帳款",
                "counterpartyCode": "",
                "summary": "CD20000001-應付帳款",
                "debitCredit": "2",
                "amount": 1575,
                "voucherCategory": "",
                "printFlag": "N",
                "taxAmount": "",
                "ledgerUuid": "e198fdaf-fa95-4448-ac8a-03c6056b600c",
                "lineUuid": "f6808f39-f420-41fe-95e1-9fa1a05a6d47",
                "settleEventUuid": "dbb6b55d-f4da-4e8d-be73-4c40dd389025",
                "isReverse": false,
                "createdDate": "20260807",
                "sortOrder": 3
            },
            {
                "rocYear": "115",
                "voucherNo": "08070020",
                "seq": "",
                "voucherType": "3",
                "rocDate": "1150807",
                "subjectName": "文具用品",
                "counterpartyCode": "",
                "summary": "CD20000002-進貨/費用",
                "debitCredit": "1",
                "amount": 2500,
                "voucherCategory": "",
                "printFlag": "N",
                "taxAmount": "",
                "ledgerUuid": "09517c1c-8a37-4605-9c3a-8789ad08eaf4",
                "lineUuid": "352e8119-03b0-499b-b2a8-93c40efd5c54",
                "settleEventUuid": "dbb6b55d-f4da-4e8d-be73-4c40dd389025",
                "isReverse": false,
                "createdDate": "20260807",
                "sortOrder": 1
            },
            {
                "rocYear": "115",
                "voucherNo": "08070020",
                "seq": "",
                "voucherType": "3",
                "rocDate": "1150807",
                "subjectName": "進項稅款",
                "counterpartyCode": "",
                "summary": "CD20000002-進項稅額",
                "debitCredit": "1",
                "amount": 125,
                "voucherCategory": "",
                "printFlag": "N",
                "taxAmount": "",
                "ledgerUuid": "09517c1c-8a37-4605-9c3a-8789ad08eaf4",
                "lineUuid": "b514f91f-7dc5-4e0d-b9c5-c9d8efdafe9d",
                "settleEventUuid": "dbb6b55d-f4da-4e8d-be73-4c40dd389025",
                "isReverse": false,
                "createdDate": "20260807",
                "sortOrder": 2
            },
            {
                "rocYear": "115",
                "voucherNo": "08070020",
                "seq": "",
                "voucherType": "3",
                "rocDate": "1150807",
                "subjectName": "應付帳款",
                "counterpartyCode": "",
                "summary": "CD20000002-應付帳款",
                "debitCredit": "2",
                "amount": 2625,
                "voucherCategory": "",
                "printFlag": "N",
                "taxAmount": "",
                "ledgerUuid": "09517c1c-8a37-4605-9c3a-8789ad08eaf4",
                "lineUuid": "7a100f7c-63e5-444e-bd3d-c538fd261dad",
                "settleEventUuid": "dbb6b55d-f4da-4e8d-be73-4c40dd389025",
                "isReverse": false,
                "createdDate": "20260807",
                "sortOrder": 3
            },
            {
                "rocYear": "115",
                "voucherNo": "08070041",
                "seq": "",
                "voucherType": "3",
                "rocDate": "1150807",
                "subjectName": "應付帳款",
                "counterpartyCode": "",
                "summary": "沖銷應付帳款",
                "debitCredit": "1",
                "amount": 1575,
                "voucherCategory": "",
                "printFlag": "N",
                "taxAmount": "",
                "ledgerUuid": "ebc326e5-bbc2-4e68-ad2e-b26ed4ca590b",
                "lineUuid": "72b7494b-8e26-4a0b-9884-16adcd5dd88a",
                "settleEventUuid": "dbb6b55d-f4da-4e8d-be73-4c40dd389025",
                "isReverse": false,
                "createdDate": "20260807",
                "sortOrder": 1
            },
            {
                "rocYear": "115",
                "voucherNo": "08070041",
                "seq": "",
                "voucherType": "3",
                "rocDate": "1150807",
                "subjectName": "應付帳款",
                "counterpartyCode": "",
                "summary": "沖銷應付帳款",
                "debitCredit": "1",
                "amount": 2625,
                "voucherCategory": "",
                "printFlag": "N",
                "taxAmount": "",
                "ledgerUuid": "ebc326e5-bbc2-4e68-ad2e-b26ed4ca590b",
                "lineUuid": "04c007a8-b3f8-436f-9ea3-367eaa13927d",
                "settleEventUuid": "dbb6b55d-f4da-4e8d-be73-4c40dd389025",
                "isReverse": false,
                "createdDate": "20260807",
                "sortOrder": 2
            },
            {
                "rocYear": "115",
                "voucherNo": "08070041",
                "seq": "",
                "voucherType": "3",
                "rocDate": "1150807",
                "subjectName": "銀行存款",
                "counterpartyCode": "",
                "summary": "付款",
                "debitCredit": "2",
                "amount": 4200,
                "voucherCategory": "",
                "printFlag": "N",
                "taxAmount": "",
                "ledgerUuid": "ebc326e5-bbc2-4e68-ad2e-b26ed4ca590b",
                "lineUuid": "75e66018-cb77-4bfc-96bd-29b56a75cc0f",
                "settleEventUuid": "dbb6b55d-f4da-4e8d-be73-4c40dd389025",
                "isReverse": false,
                "createdDate": "20260807",
                "sortOrder": 3
            }
        ]
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» ledgerUuid|string|true|none||交易uuid|
|»» settleEventUuids|[string]|true|none||沖帳事件uuids|
|»» lines|[object]|true|none||日記帳|
|»»» rocYear|string|true|none||民國年|
|»»» voucherNo|string|true|none||傳票號|
|»»» seq|string|true|none||序號（目前固定空字串）|
|»»» voucherType|string|true|none||傳票類型|
|»»» rocDate|string|true|none||民國日期 YYYMMDD|
|»»» subjectName|string|true|none||會計科目名稱|
|»»» counterpartyCode|string|true|none||對方科目／對象代碼（目前多為空|
|»»» summary|string|true|none||摘要|
|»»» debitCredit|string|true|none||借貸別：1=借、2=貸|
|»»» amount|integer|true|none||金額|
|»»» voucherCategory|string|true|none||傳票類別（目前固定空字串)|
|»»» printFlag|string|true|none||none|
|»»» taxAmount|string|true|none||none|
|»»» ledgerUuid|string|true|none||ledger_entries.uuid|
|»»» lineUuid|string|true|none||ledger_entry_lines.uuid|
|»»» settleEventUuid|string|false|none||沖帳事件uuid|
|»»» isReverse|boolean|true|none||是否為恢復分錄|
|»»» createdDate|string|true|none||分錄建立日 YYYYMMDD|
|»»» sortOrder|integer|true|none||同傳票內列排序|
|» success|boolean|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|

# 廠商名單

## GET 拿取該公司的進項廠商名單列表

GET /ael/vendors

拿取該公司的進項廠商名單列表

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|companyUuid|query|string| no |公司uuid|

> Response Examples

> 200 Response

```json
{
    "data": [
        {
            "uuid": "e2eed4d0-3ab0-4a94-b6ba-8a428c866fd5",
            "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
            "taxId": "38965019",
            "name": "原味商行",
            "registeredAddress": "南投縣中寮鄉中寮村永平路３７１號一樓",
            "bankAccountName": "原味商行",
            "bankCode": "822",
            "bankName": "中國信託",
            "branchName": "港墘分行",
            "accountNo": "1111222233334444",
            "isActive": true,
            "remark": "TEST",
            "createdAt": "2026-07-29T08:38:14Z",
            "updatedAt": "2026-07-29T08:38:14Z"
        },
        {
            "uuid": "301b53f8-1b59-4ecc-8836-ba6673e6baa7",
            "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
            "taxId": "61194605",
            "name": "和興商店",
            "registeredAddress": "南投縣中寮鄉中寮村鄉林巷４３號",
            "bankAccountName": "和興商店",
            "bankCode": "822",
            "bankName": "中國信託",
            "branchName": "港墘分行",
            "accountNo": "5555666677778888",
            "isActive": true,
            "remark": "TEST2",
            "createdAt": "2026-07-29T08:40:08Z",
            "updatedAt": "2026-07-29T08:40:08Z"
        }
    ],
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[object]|true|none||none|
|»» uuid|string|true|none||none|
|»» companyUuid|string|true|none||none|
|»» taxId|string|true|none||none|
|»» name|string|true|none||none|
|»» registeredAddress|string|true|none||none|
|»» bankAccountName|string|true|none||none|
|»» bankCode|string|true|none||none|
|»» bankName|string|true|none||none|
|»» branchName|string|true|none||none|
|»» accountNo|string|true|none||none|
|»» isActive|boolean|true|none||none|
|»» remark|string|true|none||none|
|»» createdAt|string|true|none||none|
|»» updatedAt|string|true|none||none|
|»» balance|string|true|none||餘額|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## POST 新增廠商

POST /ael/vendors

新增廠商

> Body Parameters

```json
{
  "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
  "taxId": "12345678",
  "name": "測試供應商有限公司",
  "registeredAddress": "台北市信義區信義路五段7號",
  "bankAccountName": "測試供應商有限公司",
  "bankCode": "822",
  "bankName": "中國信託",
  "branchName": "港墘分行",
  "accountNo": "123456789012",
  "remark": "常用廠商"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司uuid|
|» taxId|body|string| yes |廠商統編|
|» name|body|string| yes |廠商名稱|
|» registeredAddress|body|string| yes |登記地址|
|» bankAccountName|body|string| yes |收款戶名|
|» bankCode|body|string| yes |銀行代碼|
|» bankName|body|string| yes |銀行名稱|
|» branchName|body|string| yes |分行名稱|
|» accountNo|body|string| yes |銀行帳號|
|» remark|body|string| yes |備註|

> Response Examples

> 200 Response

```json
{
    "data": {
        "uuid": "301b53f8-1b59-4ecc-8836-ba6673e6baa7",
        "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
        "taxId": "61194605",
        "name": "和興商店",
        "registeredAddress": "南投縣中寮鄉中寮村鄉林巷４３號",
        "bankAccountName": "和興商店",
        "bankCode": "822",
        "bankName": "中國信託",
        "branchName": "港墘分行",
        "accountNo": "5555666677778888",
        "isActive": true,
        "remark": "TEST2",
        "createdAt": "2026-07-29T16:40:07.831160657+08:00",
        "updatedAt": "2026-07-29T16:40:07.831160657+08:00"
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» uuid|string|true|none||none|
|»» companyUuid|string|true|none||none|
|»» taxId|string|true|none||none|
|»» name|string|true|none||none|
|»» registeredAddress|string|true|none||none|
|»» bankAccountName|string|true|none||none|
|»» bankCode|string|true|none||none|
|»» bankName|string|true|none||none|
|»» branchName|string|true|none||none|
|»» accountNo|string|true|none||none|
|»» isActive|boolean|true|none||none|
|»» remark|string|true|none||none|
|»» createdAt|string|true|none||none|
|»» updatedAt|string|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## PATCH 更新廠商資料

PATCH /ael/vendors

更新廠商資料

> Body Parameters

```json
{
  "uuid": "e2eed4d0-3ab0-4a94-b6ba-8a428c866fd5",
  "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
  "taxId": "38965019",
  "name": "原味商行",
  "registeredAddress": "南投縣中寮鄉中寮村永平路３７１號一樓",
  "bankAccountName": "原味商行",
  "bankCode": "822",
  "bankName": "中國信託",
  "branchName": "港墘分行",
  "accountNo": "1111222233334444",
  "isActive": true,
  "remark": "TEST"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» uuid|body|string| yes |廠商uuid|
|» companyUuid|body|string| yes |公司uuid|
|» taxId|body|string| yes |廠商統編|
|» name|body|string| yes |廠商名稱|
|» registeredAddress|body|string| yes |登記地址|
|» bankAccountName|body|string| yes |收款戶名|
|» bankCode|body|string| yes |銀行代碼|
|» bankName|body|string| yes |銀行名稱|
|» branchName|body|string| yes |分行名稱|
|» accountNo|body|string| yes |銀行帳號|
|» remark|body|string| yes |備註|
|» isActive|body|boolean| yes |是否啟用|
|» balance|body|string| yes |餘額|

> Response Examples

> 200 Response

```json
{
    "data": {
        "uuid": "e2eed4d0-3ab0-4a94-b6ba-8a428c866fd5",
        "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
        "taxId": "38965019",
        "name": "原味商行",
        "registeredAddress": "南投縣中寮鄉中寮村永平路３７１號一樓",
        "bankAccountName": "原味商行",
        "bankCode": "822",
        "bankName": "中國信託",
        "branchName": "港墘分行",
        "accountNo": "1111222233334444",
        "isActive": true,
        "remark": "TESTTEST",
        "createdAt": "2026-07-29T08:38:14Z",
        "updatedAt": "2026-07-29T08:42:08Z"
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» uuid|string|true|none||none|
|»» companyUuid|string|true|none||none|
|»» taxId|string|true|none||none|
|»» name|string|true|none||none|
|»» registeredAddress|string|true|none||none|
|»» bankAccountName|string|true|none||none|
|»» bankCode|string|true|none||none|
|»» bankName|string|true|none||none|
|»» branchName|string|true|none||none|
|»» accountNo|string|true|none||none|
|»» isActive|boolean|true|none||none|
|»» remark|string|true|none||none|
|»» createdAt|string|true|none||none|
|»» updatedAt|string|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## GET 檢查公司是否在我方進項廠商名單中

GET /ael/vendors/exists

檢查公司是否在我方進項廠商名單中

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|companyUuid|query|string| yes |公司uuid|
|taxId|query|string| no |統編（與公司名稱擇一）|
|name|query|string| no |公司名稱（與統編擇一）|

> Response Examples

> 200 Response

```json
{
    "data": {
        "exists": true,
        "vendor": {
            "uuid": "e2eed4d0-3ab0-4a94-b6ba-8a428c866fd5",
            "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
            "taxId": "38965019",
            "name": "原味商行",
            "registeredAddress": "南投縣中寮鄉中寮村永平路３７１號一樓",
            "bankAccountName": "原味商行",
            "bankCode": "822",
            "bankName": "中國信託",
            "branchName": "港墘分行",
            "accountNo": "1111222233334444",
            "isActive": true,
            "remark": "TESTTEST",
            "createdAt": "2026-07-29T08:38:14Z",
            "updatedAt": "2026-07-29T08:42:08Z"
        }
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» exists|boolean|true|none||none|
|»» vendor|object|true|none||none|
|»»» uuid|string|true|none||none|
|»»» companyUuid|string|true|none||none|
|»»» taxId|string|true|none||none|
|»»» name|string|true|none||none|
|»»» registeredAddress|string|true|none||none|
|»»» bankAccountName|string|true|none||none|
|»»» bankCode|string|true|none||none|
|»»» bankName|string|true|none||none|
|»»» branchName|string|true|none||none|
|»»» accountNo|string|true|none||none|
|»»» isActive|boolean|true|none||none|
|»»» remark|string|true|none||none|
|»»» createdAt|string|true|none||none|
|»»» updatedAt|string|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

# 公司銀行帳戶

## GET 拿取該公司的銀行帳戶列表

GET /ael/bankAccounts

拿取該公司的銀行帳戶列表

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|companyUuid|query|string| yes |公司uuid|
|isActive|query|string| no |啟用與否（0：未啟用,1：啟用）|

> Response Examples

> 200 Response

```json
{
    "data": [
        {
            "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
            "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
            "accountName": "測試帳戶",
            "bankCode": "822",
            "bankName": "中國信託",
            "branchName": "港墘分行",
            "accountNo": "1234567890123456",
            "currentBalance": 100000,
            "lastBalanceUpdateDate": null,
            "isDefaultReceivingAccount": true,
            "isDefaultPaymentAccount": true,
            "isActive": true,
            "remark": "TEST",
            "createdAt": "2026-07-30T04:17:46Z",
            "updatedAt": "2026-07-30T04:17:46Z"
        }
    ],
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[object]|true|none||none|
|»» bankAccountUuid|string|false|none||none|
|»» companyUuid|string|false|none||none|
|»» accountName|string|false|none||none|
|»» bankCode|string|false|none||none|
|»» bankName|string|false|none||none|
|»» branchName|string|false|none||none|
|»» accountNo|string|false|none||none|
|»» currentBalance|integer|false|none||none|
|»» lastBalanceUpdateDate|null|false|none||none|
|»» isDefaultReceivingAccount|boolean|false|none||none|
|»» isDefaultPaymentAccount|boolean|false|none||none|
|»» isActive|boolean|false|none||none|
|»» remark|string|false|none||none|
|»» createdAt|string|false|none||none|
|»» updatedAt|string|false|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## POST 新增銀行帳戶

POST /ael/bankAccounts

新增銀行帳戶

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "accountName": "測試帳戶",
    "bankCode": "822",
    "accountNo": "1234567890123456",
    "bankName": "中國信託",
    "branchName": "港墘分行",
    "currentBalance": 100000,
    "isDefaultReceivingAccount": true,
    "isDefaultPaymentAccount": true,
    "isActive": true,
    "remark": "TEST"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司uuid|
|» accountName|body|string| yes |帳戶名稱|
|» bankCode|body|string| yes |銀行代碼|
|» accountNo|body|string| yes |銀行帳號|
|» bankName|body|string| yes |銀行名稱|
|» branchName|body|string| yes |分行名稱|
|» currentBalance|body|integer| yes |目前帳戶餘額|
|» isDefaultReceivingAccount|body|boolean| yes |是否為預設收款戶頭|
|» isDefaultPaymentAccount|body|boolean| yes |是否為預設付款戶頭|
|» isActive|body|boolean| yes |是否啟用|
|» remark|body|string| yes |備註|

> Response Examples

> 200 Response

```json
{
    "data": {
        "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
        "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
        "accountName": "測試帳戶",
        "bankCode": "822",
        "bankName": "中國信託",
        "branchName": "港墘分行",
        "accountNo": "1234567890123456",
        "currentBalance": 100000,
        "lastBalanceUpdateDate": null,
        "isDefaultReceivingAccount": true,
        "isDefaultPaymentAccount": true,
        "isActive": true,
        "remark": "TEST",
        "createdAt": "2026-07-30T12:17:45.528339647+08:00",
        "updatedAt": "2026-07-30T12:17:45.528339647+08:00"
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PATCH 更新銀行帳戶資料

PATCH /ael/bankAccounts

更新銀行帳戶資料

> Body Parameters

```json
{
    "uuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "accountName": "測試帳戶改",
    "bankCode": "822",
    "accountNo": "1234567890123456",
    "bankName": "中國信託",
    "branchName": "港墘分行",
    "currentBalance": 90000,
    "lastBalanceUpdateDate": "20260730",
    "isDefaultReceivingAccount": true,
    "isDefaultPaymentAccount": true,
    "isActive": false,
    "remark": "停用測試"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» uuid|body|string| yes |銀行帳號uuid|
|» companyUuid|body|string| yes |公司uuid|
|» accountName|body|string| yes |帳戶名稱|
|» bankCode|body|string| yes |銀行代碼|
|» accountNo|body|string| yes |銀行帳號|
|» bankName|body|string| yes |銀行名稱|
|» branchName|body|string| yes |分行名稱|
|» currentBalance|body|integer| yes |目前帳戶餘額|
|» lastBalanceUpdateDate|body|string| yes |最後更新餘額日期 YYYYMMDD|
|» isDefaultReceivingAccount|body|boolean| yes |是否為預設收款戶頭|
|» isDefaultPaymentAccount|body|boolean| yes |是否為預設付款戶頭|
|» isActive|body|boolean| yes |是否啟用|
|» remark|body|string| yes |備註|

> Response Examples

> 200 Response

```json
{
    "data": {
        "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
        "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
        "accountName": "測試帳戶改",
        "bankCode": "822",
        "bankName": "中國信託",
        "branchName": "港墘分行",
        "accountNo": "1234567890123456",
        "currentBalance": 90000,
        "lastBalanceUpdateDate": "20260730",
        "isDefaultReceivingAccount": true,
        "isDefaultPaymentAccount": true,
        "isActive": false,
        "remark": "停用測試",
        "createdAt": "2026-07-30T04:17:46Z",
        "updatedAt": "2026-07-30T04:21:15Z"
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST 拿取銀行帳戶相關沖帳事件列表

POST /ael/bankAccounts/transactions

拿取銀行帳戶相關沖帳事件列表，若要進一步瀏覽明細、日記帳跟關聯發票，請搭配GET /ael/ledger/entries/detail、GET /ael/ledger/entries/dailyDetail

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
    "dateFrom": "20260101",
    "dateTo": "20260813",
    "limit": 10,
    "page": 1
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司uuid|
|» bankAccountUuid|body|string| yes |銀行帳戶uuid|
|» dateFrom|body|string| yes |起時間 YYYYMMDD|
|» dateTo|body|string| yes |迄時間 YYYYMMDD|
|» limit|body|integer| yes |一頁資料筆數|
|» page|body|integer| yes |頁碼|

> Response Examples

> 200 Response

```json
{
  "success": true,
  "errorCode": "string",
  "message": "string",
  "data": {
    "bankAccountUuid": "string",
    "items": [
      {
        "settleEventUuid": "string",
        "reconMethod": 0,
        "side": 0,
        "paymentDate": "string",
        "settleAmount": 0,
        "cashAmount": 0,
        "cashDirection": 0,
        "isReverse": true,
        "mainSettlementLedgerUuid": "string",
        "originLedgerUuids": [
          "string"
        ],
        "primaryOriginLedgerUuid": "string",
        "hasInvoice": true,
        "counterpartyName": "string",
        "paymentChannelName": "string",
        "createdAt": "2019-08-24T14:15:22Z"
      }
    ],
    "total": 0,
    "limit": 0,
    "page": 0
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|false|none||none|
|» errorCode|string|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|
|»» bankAccountUuid|string|false|none||銀行帳戶uuid|
|»» items|[object]|false|none||none|
|»»» settleEventUuid|string|false|none||沖帳事件uuid|
|»»» reconMethod|integer|false|none||0手動／1即沖／2匯總／4銀行提匯等|
|»»» side|integer|false|none||0銷項／1進項|
|»»» paymentDate|string|false|none||YYYYMMDD|
|»»» settleAmount|integer|false|none||實際沖帳金額|
|»»» cashAmount|integer|false|none||none|
|»»» cashDirection|integer|false|none||0存入／1付出|
|»»» isReverse|boolean|false|none||是交易恢復嗎|
|»»» mainSettlementLedgerUuid|string|false|none||交易原單uuid|
|»»» originLedgerUuids|[string]|false|none||交易關聯單uuid|
|»»» primaryOriginLedgerUuid|string|false|none||none|
|»»» hasInvoice|boolean|false|none||有發票嗎|
|»»» counterpartyName|string|false|none||廠商名稱|
|»»» paymentChannelName|string|false|none||銷售管道名稱|
|»»» createdAt|string(date-time)|false|none||none|
|»» total|integer|false|none||全部資料筆數|
|»» limit|integer|false|none||一頁資料筆數|
|»» page|integer|false|none||頁碼|

## POST 銀行提／匯款

POST /ael/bankAccounts/cashMovements

建立一筆銀行直接提／匯款的交易紀錄

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "bankAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
    "cashDirection": 0,
    "amount": 1000,
    "paymentDate": "20260813",
    "officialAccountingSubjectId": 123,
    "memo": "股東往來匯入"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司uuid|
|» bankAccountUuid|body|string| yes |銀行帳戶uuid|
|» cashDirection|body|integer| yes |0 匯入／1 提出|
|» amount|body|integer| yes |金額|
|» paymentDate|body|string| yes |YYYYMMDD|
|» officialAccountingSubjectId|body|integer| yes |科目id|
|» memo|body|string| yes |備註|

> Response Examples

> 200 Response

```json
{
  "success": true,
  "errorCode": "string",
  "message": "string",
  "data": {
    "ledgerEntryUuid": "string",
    "orderCode": "string",
    "settleEventUuid": "string",
    "bankAccountUuid": "string",
    "cashDirection": 0,
    "amount": 0,
    "paymentDate": "string"
  }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» success|boolean|false|none||none|
|» errorCode|string|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|
|»» ledgerEntryUuid|string|false|none||交易uuid|
|»» orderCode|string|false|none||交易編號|
|»» settleEventUuid|string|false|none||沖帳事件uuid|
|»» bankAccountUuid|string|false|none||銀行帳戶uuid|
|»» cashDirection|integer|false|none||0匯入／1提出|
|»» amount|integer|false|none||金額|
|»» paymentDate|string|false|none||YYYYMMDD|

# 基礎設定

## GET 查詢公司基本設定

GET /ael/basic/companySetting

查詢公司基本設定

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|acUuid|query|string| no |公司uuid|

> Response Examples

> 200 Response

```json
{
    "data": {
        "acUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
        "taxIdNumber": "82999614",
        "taxId": "720624480",
        "companyName": "盤古投資有限公司",
        "companyAddrPostal": "114",
        "companyAddr": "臺北市內湖區瑞光路358巷30弄6號6樓",
        "orgType": "有限公司",
        "headName": "彭建彰",
        "headPhone": "0978758118",
        "contactName": "彭建彰",
        "contactPhone": "0978758118",
        "contactEmail": "lolicia.liu@relianz.tw",
        "contactRemark": "TEST",
        "agencyCode": "A72",
        "introduction": "AAA",
        "propertyTaxNo": "",
        "nhiInsuranceCode": "154570135",
        "customerNumber": 119,
        "disasterRateId": null,
        "buyReconciliationMethod": 0,
        "sellReconciliationMethod": 0,
        "createTime": "2024-05-27T12:06:07Z",
        "updateTime": "2026-07-20T08:29:13Z"
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PATCH 更新公司基本設定(含對帳方式）

PATCH /ael/basic/companySetting/reconciliationMethod

更新公司基本設定(含對帳方式），都選填，不傳該欄位就不更新

> Body Parameters

```json
{
    "acUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "buyReconciliationMethod": 0,
    "sellReconciliationMethod": 1,
    "headName": "彭建彰",
    "headPhone": "0978758118",
    "contactName": "彭建彰",
    "contactPhone": "0978758118",
    "contactEmail": "lolicia.liu@relianz.tw",
    "agencyCode": "A72",
    "introduction": "TEST",
    "propertyTaxNo": "",
    "nhiInsuranceCode": "154570135"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» acUuid|body|string| yes |none|
|» buyReconciliationMethod|body|integer| no |進項對帳方式（0:手動對帳,1:發票上傳既付款,2:匯總對帳）|
|» sellReconciliationMethod|body|integer| no |銷項對帳方式（0:手動對帳,1:發票開立既收款,2:匯總對帳,3:自動對帳）|
|» headName|body|string| no |負責人姓名|
|» headPhone|body|string| no |負責人電話|
|» contactName|body|string| no |聯絡人姓名|
|» contactPhone|body|string| no |聯絡人電話|
|» contactEmail|body|string| no |聯絡人Email|
|» agencyCode|body|string| no |稽徵機關代號|
|» introduction|body|string| no |公司簡介、業務性質及銷售管道|
|» propertyTaxNo|body|string| no |房屋稅籍編號|
|» nhiInsuranceCode|body|string| no |健保投保單位代號|

> Response Examples

> 200 Response

```json
{
    "data": {
        "acUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
        "taxIdNumber": "82999614",
        "taxId": "720624480",
        "companyName": "盤古投資有限公司",
        "companyAddrPostal": "114",
        "companyAddr": "臺北市內湖區瑞光路358巷30弄6號6樓",
        "orgType": "有限公司",
        "headName": "彭建彰",
        "headPhone": "0978758118",
        "contactName": "彭建彰",
        "contactPhone": "0978758118",
        "contactEmail": "lolicia.liu@relianz.tw",
        "contactRemark": "TEST",
        "agencyCode": "A72",
        "introduction": "TEST222",
        "propertyTaxNo": "",
        "nhiInsuranceCode": "154570135",
        "customerNumber": 119,
        "disasterRateId": null,
        "buyReconciliationMethod": 0,
        "sellReconciliationMethod": 1,
        "createTime": "2024-05-27T12:06:07Z",
        "updateTime": "2026-07-30T04:18:12Z"
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# 銷售管道

## POST 新增銷售管道規則

POST /ael/payment/channelRules

新增銷售管道規則
ps. feeRateBps 以及 feeFixedAmount 在自動入帳前都先掛 0

> Body Parameters

```json
{
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "channelName": "蝦皮",
    "settlementStyle": 0,
    "settlementAmount": 7,
    "receivingAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
    "feeRateBps": 200,
    "feeFixedAmount": 3,
    "isActive": true,
    "remark": "2.00%+3元",
    "initDefaultOther": false
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» companyUuid|body|string| yes |公司uuid|
|» channelName|body|string| yes |渠道名稱|
|» settlementStyle|body|integer| yes |入帳規則類型，0:固定延遲天數，1:每週固定星期，2:每月固定日期|
|» settlementAmount|body|integer| yes |settlement_style=0時即固定延遲入帳天數，settlement_style=1即每週入帳星期，settlement_style=2即每月入帳日期|
|» receivingAccountUuid|body|string| yes |關聯公司銀行帳戶uuid|
|» feeRateBps|body|integer| yes |手續費基點 （2.75%=275）|
|» feeFixedAmount|body|integer| yes |固定手續費(元)|
|» isActive|body|boolean| yes |是否啟用|
|» remark|body|string| yes |備註|
|» initDefaultOther|body|boolean| yes |初始化“其他”嗎？|

> Response Examples

> 200 Response

```json
{
    "data": {
        "channelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
        "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
        "channelName": "蝦皮",
        "receivingAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
        "settlementStyle": 0,
        "settlementAmount": 7,
        "feeRateBps": 200,
        "feeFixedAmount": 3,
        "isActive": true,
        "remark": "2.00%+3元",
        "createdAt": "2026-07-30T16:41:19.259778319+08:00",
        "updatedAt": "2026-07-30T16:41:19.259778319+08:00"
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|object|true|none||none|
|»» channelUuid|string|true|none||none|
|»» companyUuid|string|true|none||none|
|»» channelName|string|true|none||none|
|»» receivingAccountUuid|string|true|none||none|
|»» settlementStyle|integer|true|none||none|
|»» settlementAmount|integer|true|none||none|
|»» feeRateBps|integer|true|none||none|
|»» feeFixedAmount|integer|true|none||none|
|»» isActive|boolean|true|none||none|
|»» remark|string|true|none||none|
|»» createdAt|string|true|none||none|
|»» updatedAt|string|true|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## GET 撈取公司所有銷售管道規則

GET /ael/payment/channelRules

撈取公司所有銷售管道規則

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|companyUuid|query|string| yes |公司uuid|
|isActive|query|string| no |啟用與否（0：未啟用,1：啟用）|

> Response Examples

> 200 Response

```json
{
    "data": [
        {
            "channelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
            "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
            "channelName": "蝦皮",
            "receivingAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
            "settlementStyle": 0,
            "settlementAmount": 7,
            "feeRateBps": 200,
            "feeFixedAmount": 3,
            "isActive": true,
            "remark": "2.00%+3元",
            "createdAt": "2026-07-30T08:41:19Z",
            "updatedAt": "2026-07-30T08:41:19Z"
        }
    ],
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[object]|true|none||none|
|»» channelUuid|string|false|none||none|
|»» companyUuid|string|false|none||none|
|»» channelName|string|false|none||none|
|»» receivingAccountUuid|string|false|none||none|
|»» settlementStyle|integer|false|none||none|
|»» settlementAmount|integer|false|none||none|
|»» feeRateBps|integer|false|none||none|
|»» feeFixedAmount|integer|false|none||none|
|»» isActive|boolean|false|none||none|
|»» remark|string|false|none||none|
|»» createdAt|string|false|none||none|
|»» updatedAt|string|false|none||none|
|» errorCode|string|true|none||none|
|» message|string|true|none||none|
|» success|boolean|true|none||none|

## PATCH 更新銷售管道規則

PATCH /ael/payment/channelRules

更新銷售管道規則，“其他”銷售管道除了更新關聯銀行帳戶外都會檔

> Body Parameters

```json
{
    "uuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
    "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
    "feeRateBps": 300,
    "feeFixedAmount": 0,
    "isActive": true
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» uuid|body|string| yes |渠道uuid|
|» companyUuid|body|string| yes |公司uuid|
|» channelName|body|string| no |渠道名稱|
|» settlementStyle|body|string| no |入帳規則類型，0:固定延遲天數，1:每週固定星期，2:每月固定日期|
|» settlementAmount|body|string| no |settlement_style=0時即固定延遲入帳天數，settlement_style=1即每週入帳星期，|
|» receivingAccountUuid|body|string| no |關聯公司銀行帳戶uuid|
|» feeRateBps|body|integer| no |手續費基點 （2.75%=275）|
|» feeFixedAmount|body|integer| no |固定手續費(元)|
|» isActive|body|boolean| no |是否啟用|
|» remark|body|string| no |備註|
|» balance|body|string| yes |餘額|

> Response Examples

> 200 Response

```json
{
    "data": {
        "channelUuid": "5900d3b6-d6b3-4075-92ad-890aee377301",
        "companyUuid": "e716954c-cd28-4cff-a7bc-d15d89285746",
        "channelName": "蝦皮",
        "receivingAccountUuid": "6a0bc0cc-3fb8-4b2f-a02a-c7af65a25dd2",
        "settlementStyle": 0,
        "settlementAmount": 7,
        "feeRateBps": 250,
        "feeFixedAmount": 0,
        "isActive": true,
        "remark": "2.00%+3元",
        "createdAt": "2026-07-30T08:41:19Z",
        "updatedAt": "2026-07-30T08:43:19Z"
    },
    "errorCode": "0000",
    "message": "操作成功",
    "success": true
}
```

> 400 Response

```json
{
    "data": null,
    "errorCode": "0005",
    "message": "系統預設管道「其他」僅可更新 receivingAccountUuid",
    "success": false
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|none|Inline|

### Responses Data Schema

# Data Schema

