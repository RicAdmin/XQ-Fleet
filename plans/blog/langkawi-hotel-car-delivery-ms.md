---
title: 'Penghantaran Kereta ke Hotel di Langkawi'
slug: 'langkawi-hotel-car-delivery-ms'
language: ms
category: Airport & Pickup
status: pending
created: 2026-07-23
primaryQuery: 'penghantaran kereta hotel langkawi'
readerIntent: 'Tahu bila penghantaran hotel percuma dan bila yuran custom dikenakan'
---

## Editorial Thesis

Hotel dalam senarai autocomplete percuma; villa/alamat taip sendiri menggunakan yuran penghantaran hotel (RM50 pada harga seed).

## Answer-First Promise

Pilih hotel dari senarai semasa checkout untuk RM0; jangan andaikan semua alamat percuma.

## Reader

Tetamu resort/homestay yang mahu elak teksi dari LGK ke lobi.

## Outline

1. Apa yang percuma
2. Apa yang dikenakan yuran
3. Pulangan / kutipan
4. Alternatif Pintu 3 / jeti

## Evidence Ledger

| Claim or detail | Source | Checked | Status |
| --- | --- | --- | --- |
| isCustomDeliveryLocation + calculateDeliveryFee | src/lib/pricing-logic.ts | 2026-07-23 | verified |
| Delivery_Fee_Hotel seed RM50 on cars | data/Car.csv | 2026-07-23 | verified |
| Coverage/ETA by north-island zone | XQ Car operator notes | 2026-07-23 | operator check required |

## Product Connections

- Vehicle slugs: perodua-axia, perodua-bezza, perodua-alza
- Internal links: /en/blog/langkawi-hotel-car-delivery, /ms/blog/langkawi-airport-car-rental-pickup-ms, /en/blog/langkawi-ferry-jetty-car-rental

## Search Language

- Primary query: penghantaran kereta hotel langkawi
- Natural variants: hantar kereta ke hotel langkawi, delivery kereta sewa langkawi, free hotel delivery langkawi
- Questions to answer: Penghantaran hotel percuma ke?; Villa private kena bayar delivery?

## Image Brief

- Project-owned candidates: `/image/hero-langkawi-adventure-768.jpg`
- Generated fallback: Hotel porte-cochère handover illustration, XQ Car palette

## Voice Notes

Betulkan mitos "semua hotel percuma"; telus tentang custom fee.

## Freshness and Operator Checks

- Semak senarai hotel & yuran semasa draf
