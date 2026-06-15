-- Migration 0002: Add card_network column to sources.
--
-- Surfaces the card network (Visa / Mastercard / Amex / UnionPay / JCB /
-- Discover) on credit-card sources. Optional — null on existing rows and
-- on non-credit-card categories.
--
-- SQLite ALTER TABLE ... ADD COLUMN is non-transactional and instant on
-- nullable columns, so this is safe to apply against the production D1
-- with active site traffic.

ALTER TABLE sources ADD COLUMN card_network TEXT;
