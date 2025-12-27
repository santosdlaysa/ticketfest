-- =====================================================
-- MIGRATION: Fix encrypted fields column sizes
-- Date: 2024-12-26
-- Description: Increase CPF and phone column sizes to accommodate encrypted data
-- =====================================================

-- The encryption function (AES-256-GCM) produces output in format:
-- iv:authTag:encryptedData (all in base64)
-- This results in ~70-100 characters for a typical CPF/phone

-- Alter CPF column from varchar(14) to varchar(255)
ALTER TABLE users
ALTER COLUMN cpf TYPE VARCHAR(255);

-- Alter phone column from varchar(20) to varchar(255) if it's also encrypted
ALTER TABLE users
ALTER COLUMN phone TYPE VARCHAR(255);

-- Also fix list_items table which has cpf and phone
ALTER TABLE list_items
ALTER COLUMN cpf TYPE VARCHAR(255);

ALTER TABLE list_items
ALTER COLUMN phone TYPE VARCHAR(255);

-- =====================================================
-- END OF MIGRATION
-- =====================================================
