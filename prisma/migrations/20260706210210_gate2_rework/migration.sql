-- DropForeignKey
ALTER TABLE `qc_inspection` DROP FOREIGN KEY `qc_inspection_batch_id_fkey`;

-- AlterTable
ALTER TABLE `customer` ADD COLUMN `registered_address` TEXT NULL,
    ADD COLUMN `tax_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `invoice` ADD COLUMN `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `document_snapshot` JSON NULL;

-- AlterTable
ALTER TABLE `lot` ADD COLUMN `supplier_name` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `qc_inspection` ADD COLUMN `lot_id` INTEGER NULL,
    MODIFY `batch_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `company_profile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_name` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `tax_id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `logo_url` VARCHAR(191) NULL,
    `updated_by` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `customer_tax_id_idx` ON `customer`(`tax_id`);

-- CreateIndex
CREATE INDEX `lot_received_date_idx` ON `lot`(`received_date`);

-- CreateIndex
CREATE INDEX `qc_inspection_lot_id_idx` ON `qc_inspection`(`lot_id`);

-- AddForeignKey
ALTER TABLE `qc_inspection` ADD CONSTRAINT `qc_inspection_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qc_inspection` ADD CONSTRAINT `qc_inspection_lot_id_fkey` FOREIGN KEY (`lot_id`) REFERENCES `lot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_profile` ADD CONSTRAINT `company_profile_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
