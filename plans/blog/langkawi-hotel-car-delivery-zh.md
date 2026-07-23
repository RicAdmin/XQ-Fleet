---
title: '兰卡威酒店送车：免费与收费边界'
slug: 'langkawi-hotel-car-delivery-zh'
language: zh
category: Airport & Pickup
status: pending
created: 2026-07-23
primaryQuery: '兰卡威酒店送车'
readerIntent: '弄清哪些酒店免费送车、哪些自定义地址要收费'
---

## Editorial Thesis

预订列表内酒店免费；手输别墅/未列出地址按酒店送车费（seed为RM50）。

## Answer-First Promise

结账选列表酒店=RM0；不要假设“所有住宿都免送车费”。

## Reader

订了度假村或民宿、想省略机场打车的旅客。

## Outline

1. 免费范围
2. 收费情形
3. 还车/回收
4. 改回机场3号门

## Evidence Ledger

| Claim or detail | Source | Checked | Status |
| --- | --- | --- | --- |
| calculateDeliveryFee / isCustomDeliveryLocation | src/lib/pricing-logic.ts | 2026-07-23 | verified |
| Delivery_Fee_Hotel RM50 seed | data/Car.csv | 2026-07-23 | verified |
| North-island ETA norms | XQ Car operator notes | 2026-07-23 | operator check required |

## Product Connections

- Vehicle slugs: perodua-axia, perodua-bezza, perodua-alza
- Internal links: /en/blog/langkawi-hotel-car-delivery, /en/blog/langkawi-airport-car-rental-pickup, /en/blog/book-car-rental-langkawi-online

## Search Language

- Primary query: 兰卡威酒店送车
- Natural variants: 兰卡威送车上门, 酒店取车兰卡威, 别墅送车费
- Questions to answer: 酒店送车免费吗？; 私人别墅要加钱吗？

## Image Brief

- Project-owned candidates: `/image/hero-langkawi-adventure-768.jpg`
- Generated fallback: Hotel porte-cochère handover illustration, XQ Car palette

## Voice Notes

纠正“全部免费”的旧文案；透明说明自定义费。

## Freshness and Operator Checks

- 写稿复核列表与费用
