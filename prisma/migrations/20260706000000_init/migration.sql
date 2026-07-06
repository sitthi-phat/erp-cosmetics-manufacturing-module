-- CreateTable
CREATE TABLE `number_sequence` (
    `prefix` VARCHAR(191) NOT NULL,
    `period_key` VARCHAR(191) NOT NULL,
    `counter` BIGINT NOT NULL DEFAULT 0,

    PRIMARY KEY (`prefix`, `period_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(191) NOT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `role_role_name_key`(`role_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `allow` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `permission_role_id_resource_action_key`(`role_id`, `resource`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role_id` INTEGER NOT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_user_id_key`(`user_id`),
    UNIQUE INDEX `user_username_key`(`username`),
    INDEX `user_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` TEXT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `contact_person` VARCHAR(191) NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `customer_customer_id_key`(`customer_id`),
    INDEX `customer_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `uom` VARCHAR(191) NOT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',

    UNIQUE INDEX `bom_product_id_key`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bom_line` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bom_id` INTEGER NOT NULL,
    `material_id` INTEGER NOT NULL,
    `qty_per_unit` DECIMAL(12, 4) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `raw_material` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `uom` VARCHAR(191) NOT NULL,
    `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `material_id` INTEGER NOT NULL,
    `lot_number` VARCHAR(191) NOT NULL,
    `received_qty` DECIMAL(12, 3) NOT NULL,
    `remaining_qty` DECIMAL(12, 3) NOT NULL,
    `received_date` DATETIME(3) NOT NULL,
    `incoming_qc_status` ENUM('Pending', 'Passed', 'Failed') NOT NULL DEFAULT 'Pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `lot_material_id_lot_number_key`(`material_id`, `lot_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_balance` (
    `material_id` INTEGER NOT NULL,
    `physical_qty` DECIMAL(12, 3) NOT NULL DEFAULT 0,
    `reserved_qty` DECIMAL(12, 3) NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`material_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_transaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `material_id` INTEGER NOT NULL,
    `lot_id` INTEGER NULL,
    `type` ENUM('Receipt', 'Reservation', 'ReservationRelease', 'Issue', 'Adjustment') NOT NULL,
    `qty` DECIMAL(12, 3) NOT NULL,
    `ref_doc_type` VARCHAR(191) NULL,
    `ref_doc_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_transaction_material_id_created_at_idx`(`material_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `po_number` VARCHAR(191) NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `order_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `requested_delivery_date` DATETIME(3) NOT NULL,
    `status` ENUM('Draft', 'Confirmed', 'InProduction', 'Shipped', 'Invoiced', 'Closed', 'Cancelled') NOT NULL DEFAULT 'Draft',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `purchase_order_po_number_key`(`po_number`),
    INDEX `purchase_order_status_idx`(`status`),
    INDEX `purchase_order_customer_id_idx`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `po_status_event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `po_id` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `detail` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `po_status_event_po_id_created_at_idx`(`po_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `po_line` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `po_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `quantity` DECIMAL(12, 3) NOT NULL,
    `uom` VARCHAR(191) NOT NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `production_order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `po_line_id` INTEGER NOT NULL,
    `po_id` INTEGER NOT NULL,
    `assigned_to` INTEGER NULL,
    `status` ENUM('Pending', 'Assigned', 'InProgress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    `planned_qty` DECIMAL(12, 3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `production_order_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batch_number` VARCHAR(191) NOT NULL,
    `production_order_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `produced_qty` DECIMAL(12, 3) NOT NULL,
    `status` ENUM('InProgress', 'Completed', 'QCPending', 'QCApproved', 'QCRejected', 'ReadyToShip', 'Shipped') NOT NULL DEFAULT 'InProgress',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `batch_batch_number_key`(`batch_number`),
    UNIQUE INDEX `batch_production_order_id_key`(`production_order_id`),
    INDEX `batch_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batch_lot_usage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batch_id` INTEGER NOT NULL,
    `lot_id` INTEGER NOT NULL,
    `material_id` INTEGER NOT NULL,
    `qty_used` DECIMAL(12, 3) NOT NULL,

    INDEX `batch_lot_usage_lot_id_idx`(`lot_id`),
    INDEX `batch_lot_usage_batch_id_idx`(`batch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qc_inspection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batch_id` INTEGER NOT NULL,
    `inspector_id` INTEGER NOT NULL,
    `result` ENUM('Approved', 'Rejected') NOT NULL,
    `remarks` TEXT NULL,
    `inspected_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `qc_inspection_batch_id_idx`(`batch_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shipment_number` VARCHAR(191) NOT NULL,
    `po_id` INTEGER NOT NULL,
    `batch_id` INTEGER NOT NULL,
    `shipped_date` DATETIME(3) NOT NULL,
    `delivered_date` DATETIME(3) NULL,
    `status` ENUM('Draft', 'Shipped', 'Delivered') NOT NULL DEFAULT 'Draft',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shipment_shipment_number_key`(`shipment_number`),
    INDEX `shipment_po_id_idx`(`po_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_no` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `parent_invoice_id` INTEGER NULL,
    `po_id` INTEGER NOT NULL,
    `issue_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `issued_by` INTEGER NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `vat_rate_applied` DECIMAL(5, 2) NOT NULL,
    `vat_amount` DECIMAL(12, 2) NOT NULL,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('Issued', 'PartiallyPaid', 'Paid', 'Overpaid', 'Superseded') NOT NULL DEFAULT 'Issued',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `invoice_po_id_version_idx`(`po_id`, `version`),
    UNIQUE INDEX `invoice_invoice_no_version_key`(`invoice_no`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_line` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(12, 3) NOT NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `line_total` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_chain_key` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_date` DATETIME(3) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `recorded_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_invoice_chain_key_idx`(`invoice_chain_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vat_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rate` DECIMAL(5, 2) NOT NULL,
    `updated_by` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action_type` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(191) NOT NULL,
    `entity_id` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `detail` TEXT NULL,

    INDEX `audit_log_user_id_timestamp_idx`(`user_id`, `timestamp`),
    INDEX `audit_log_action_type_timestamp_idx`(`action_type`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `permission` ADD CONSTRAINT `permission_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom` ADD CONSTRAINT `bom_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_line` ADD CONSTRAINT `bom_line_bom_id_fkey` FOREIGN KEY (`bom_id`) REFERENCES `bom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_line` ADD CONSTRAINT `bom_line_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `raw_material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lot` ADD CONSTRAINT `lot_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `raw_material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_balance` ADD CONSTRAINT `stock_balance_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `raw_material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_transaction` ADD CONSTRAINT `stock_transaction_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `raw_material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_transaction` ADD CONSTRAINT `stock_transaction_lot_id_fkey` FOREIGN KEY (`lot_id`) REFERENCES `lot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order` ADD CONSTRAINT `purchase_order_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `po_status_event` ADD CONSTRAINT `po_status_event_po_id_fkey` FOREIGN KEY (`po_id`) REFERENCES `purchase_order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `po_line` ADD CONSTRAINT `po_line_po_id_fkey` FOREIGN KEY (`po_id`) REFERENCES `purchase_order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `po_line` ADD CONSTRAINT `po_line_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `production_order` ADD CONSTRAINT `production_order_po_line_id_fkey` FOREIGN KEY (`po_line_id`) REFERENCES `po_line`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `production_order` ADD CONSTRAINT `production_order_po_id_fkey` FOREIGN KEY (`po_id`) REFERENCES `purchase_order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `production_order` ADD CONSTRAINT `production_order_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch` ADD CONSTRAINT `batch_production_order_id_fkey` FOREIGN KEY (`production_order_id`) REFERENCES `production_order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch` ADD CONSTRAINT `batch_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch_lot_usage` ADD CONSTRAINT `batch_lot_usage_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch_lot_usage` ADD CONSTRAINT `batch_lot_usage_lot_id_fkey` FOREIGN KEY (`lot_id`) REFERENCES `lot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batch_lot_usage` ADD CONSTRAINT `batch_lot_usage_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `raw_material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qc_inspection` ADD CONSTRAINT `qc_inspection_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qc_inspection` ADD CONSTRAINT `qc_inspection_inspector_id_fkey` FOREIGN KEY (`inspector_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipment` ADD CONSTRAINT `shipment_po_id_fkey` FOREIGN KEY (`po_id`) REFERENCES `purchase_order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shipment` ADD CONSTRAINT `shipment_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_po_id_fkey` FOREIGN KEY (`po_id`) REFERENCES `purchase_order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_issued_by_fkey` FOREIGN KEY (`issued_by`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `invoice_parent_invoice_id_fkey` FOREIGN KEY (`parent_invoice_id`) REFERENCES `invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_line` ADD CONSTRAINT `invoice_line_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_recorded_by_fkey` FOREIGN KEY (`recorded_by`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vat_config` ADD CONSTRAINT `vat_config_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

