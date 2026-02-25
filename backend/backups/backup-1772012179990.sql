-- MySQL dump 10.13  Distrib 9.4.0, for macos15.4 (arm64)
--
-- Host: localhost    Database: bricksync
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Attendances`
--

DROP TABLE IF EXISTS `Attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Attendances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userid` int NOT NULL,
  `date` date NOT NULL,
  `forenoon` tinyint(1) DEFAULT '0',
  `afternoon` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date_attendance` (`userid`,`date`),
  CONSTRAINT `attendances_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `Users` (`userid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Attendances`
--

LOCK TABLES `Attendances` WRITE;
/*!40000 ALTER TABLE `Attendances` DISABLE KEYS */;
/*!40000 ALTER TABLE `Attendances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_details`
--

DROP TABLE IF EXISTS `bank_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `accountNumber` varchar(20) NOT NULL,
  `holderName` varchar(255) NOT NULL,
  `amount` int NOT NULL,
  `Gpay` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `bankTransfer` tinyint(1) NOT NULL DEFAULT '0',
  `phonepe` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_details`
--

LOCK TABLES `bank_details` WRITE;
/*!40000 ALTER TABLE `bank_details` DISABLE KEYS */;
INSERT INTO `bank_details` VALUES (1,'KVB','8016955938188444','Aswath',78999,0,'2026-02-25 08:10:03','2026-02-25 08:10:03',1,1),(2,'Cash','1234567890098765','Balamani M',99900,0,'2026-02-25 08:10:58','2026-02-25 08:14:18',0,0);
/*!40000 ALTER TABLE `bank_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bunk_statements`
--

DROP TABLE IF EXISTS `bunk_statements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bunk_statements` (
  `statementId` int NOT NULL AUTO_INCREMENT,
  `bunkId` int NOT NULL,
  `vehicleId` int DEFAULT NULL,
  `fuelId` int DEFAULT NULL,
  `date` datetime NOT NULL,
  `amount` float NOT NULL,
  `isFueled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`statementId`),
  KEY `bunkId` (`bunkId`),
  KEY `vehicleId` (`vehicleId`),
  KEY `fuelId` (`fuelId`),
  CONSTRAINT `bunk_statements_ibfk_1` FOREIGN KEY (`bunkId`) REFERENCES `bunks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bunk_statements_ibfk_2` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bunk_statements_ibfk_3` FOREIGN KEY (`fuelId`) REFERENCES `vehicle_fuels` (`fuelId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bunk_statements`
--

LOCK TABLES `bunk_statements` WRITE;
/*!40000 ALTER TABLE `bunk_statements` DISABLE KEYS */;
INSERT INTO `bunk_statements` VALUES (1,1,1,1,'2026-02-25 00:00:00',500,1,'2026-02-25 08:13:47','2026-02-25 08:13:47');
/*!40000 ALTER TABLE `bunk_statements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bunks`
--

DROP TABLE IF EXISTS `bunks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bunks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bunkName` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `amount` int NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ownerName` varchar(255) NOT NULL DEFAULT 'Unknown',
  `phoneNumber` varchar(255) NOT NULL DEFAULT '0000000000',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bunks`
--

LOCK TABLES `bunks` WRITE;
/*!40000 ALTER TABLE `bunks` DISABLE KEYS */;
INSERT INTO `bunks` VALUES (1,'SR Bunk','Testing',400,'2026-02-25 08:11:41','2026-02-25 08:14:18','kumar','9876543210');
/*!40000 ALTER TABLE `bunks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ContactInfos`
--

DROP TABLE IF EXISTS `ContactInfos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ContactInfos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isviewed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ContactInfos`
--

LOCK TABLES `ContactInfos` WRITE;
/*!40000 ALTER TABLE `ContactInfos` DISABLE KEYS */;
INSERT INTO `ContactInfos` VALUES (1,'Merosan','9042171288','mrsn512@gmail.com','2026-02-25 06:21:42','2026-02-25 06:38:00',1),(2,'Merosan','12345678900','Mrsn512@gmail.com','2026-02-25 06:28:45','2026-02-25 06:37:59',1),(3,'Aswath M','1234567890','mrsn512@gmail.com','2026-02-25 06:35:11','2026-02-25 06:37:58',1),(4,'Aswath M','9042171288','maswath55@gmail.com','2026-02-25 06:35:44','2026-02-25 06:37:57',1);
/*!40000 ALTER TABLE `ContactInfos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `employee_name` varchar(150) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fuel_statement`
--

DROP TABLE IF EXISTS `fuel_statement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fuel_statement` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bunk_id` int NOT NULL,
  `bank_id` int NOT NULL,
  `amount` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `payment_mode` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  KEY `bunk_id` (`bunk_id`),
  KEY `bank_id` (`bank_id`),
  CONSTRAINT `fuel_statement_ibfk_1` FOREIGN KEY (`bunk_id`) REFERENCES `bunks` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fuel_statement_ibfk_2` FOREIGN KEY (`bank_id`) REFERENCES `bank_details` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fuel_statement`
--

LOCK TABLES `fuel_statement` WRITE;
/*!40000 ALTER TABLE `fuel_statement` DISABLE KEYS */;
INSERT INTO `fuel_statement` VALUES (1,1,2,100,'2026-02-25 08:14:18','2026-02-25 08:14:18','CASH','Yes');
/*!40000 ALTER TABLE `fuel_statement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_entries`
--

DROP TABLE IF EXISTS `material_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `date` datetime NOT NULL,
  `product_id` int NOT NULL,
  `office_id` int NOT NULL,
  `units` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `product_id` (`product_id`),
  KEY `office_id` (`office_id`),
  CONSTRAINT `material_entries_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `material_suppliers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `material_entries_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `material_entries_ibfk_3` FOREIGN KEY (`office_id`) REFERENCES `offices` (`office_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_entries`
--

LOCK TABLES `material_entries` WRITE;
/*!40000 ALTER TABLE `material_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_entry_fields`
--

DROP TABLE IF EXISTS `material_entry_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_entry_fields` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entry_id` int NOT NULL,
  `field_name` varchar(255) NOT NULL,
  `field_value` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `entry_id` (`entry_id`),
  CONSTRAINT `material_entry_fields_ibfk_1` FOREIGN KEY (`entry_id`) REFERENCES `material_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_entry_fields`
--

LOCK TABLES `material_entry_fields` WRITE;
/*!40000 ALTER TABLE `material_entry_fields` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_entry_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_statements`
--

DROP TABLE IF EXISTS `material_statements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_statements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `bank_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_mode` varchar(255) NOT NULL,
  `description` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  KEY `bank_id` (`bank_id`),
  CONSTRAINT `material_statements_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `material_suppliers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `material_statements_ibfk_2` FOREIGN KEY (`bank_id`) REFERENCES `bank_details` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_statements`
--

LOCK TABLES `material_statements` WRITE;
/*!40000 ALTER TABLE `material_statements` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_statements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_supplier_fields`
--

DROP TABLE IF EXISTS `material_supplier_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_supplier_fields` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `field_name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `field_options` text,
  PRIMARY KEY (`id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `material_supplier_fields_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `material_suppliers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_supplier_fields`
--

LOCK TABLES `material_supplier_fields` WRITE;
/*!40000 ALTER TABLE `material_supplier_fields` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_supplier_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_suppliers`
--

DROP TABLE IF EXISTS `material_suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shop_name` varchar(255) NOT NULL,
  `owner_name` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `phone_no` varchar(15) NOT NULL,
  `address` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_suppliers`
--

LOCK TABLES `material_suppliers` WRITE;
/*!40000 ALTER TABLE `material_suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Notepads`
--

DROP TABLE IF EXISTS `Notepads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notepads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `verifiedId` varchar(255) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `address` text,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `notes` text,
  `companySignature` varchar(255) DEFAULT NULL,
  `pdfPath` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `verifiedId` (`verifiedId`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notepads`
--

LOCK TABLES `Notepads` WRITE;
/*!40000 ALTER TABLE `Notepads` DISABLE KEYS */;
INSERT INTO `Notepads` VALUES (1,'ASW-972006','ASWATH HOLLOW BRICKS & LORRY SERVICES','SS Tower, Pandian Nagar Bus Stop,\nPN Road, Tiruppur - 641602','+91 98420 48181, 98430 83521','bricksync001@gmail.com','www.aswath.online','To Whom It May Concern,\n\nThis is to certify that we provide premium grade hollow bricks manufactured with high-density materials, ensuring maximum structural integrity. \n\nOur integrated lorry services guarantee door-step delivery within the committed timeframe. We value your business and look forward to a long-term partnership.','M. BALAMANI','/pdfs/Notepad_1772008755492.pdf','2026-02-25 08:39:15','2026-02-25 08:39:15',NULL),(2,'ASW-538170','ASWATH HOLLOW BRICKS & LORRY SERVICES','SS Tower, Pandian Nagar Bus Stop,\nPN Road, Tiruppur - 641602','+91 98420 48181, 98430 83521','bricksync001@gmail.com','www.aswath.online','To Whom It May Concern,\n\nThis is to certify that we provide premium grade hollow bricks manufactured with high-density materials, ensuring maximum structural integrity. \n\nOur integrated lorry services guarantee door-step delivery within the committed timeframe. We value your business and look forward to a long-term partnership.','M. BALAMANI','/pdfs/Notepad_1772009288214.pdf','2026-02-25 08:48:08','2026-02-25 08:48:08',NULL),(3,'ASW-452293','ASWATH HOLLOW BRICKS & LORRY SERVICES','SS Tower, Pandian Nagar Bus Stop,\nPN Road, Tiruppur - 641602','+91 98420 48181, 98430 83521','bricksync001@gmail.com','www.aswath.online','To Whom It May Concern,\n\nThis is to certify that we provide premium grade hollow bricks manufactured with high-density materials, ensuring maximum structural integrity. \n\nOur integrated lorry services guarantee door-step delivery within the committed timeframe. We value your business and look forward to a long-term partnership.','M. BALAMANI','/pdfs/Notepad_1772010259172.pdf','2026-02-25 09:04:19','2026-02-25 09:04:19','Notepad_ASW-452293.pdf');
/*!40000 ALTER TABLE `Notepads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offices`
--

DROP TABLE IF EXISTS `offices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offices` (
  `office_id` int NOT NULL AUTO_INCREMENT,
  `office_name` varchar(100) NOT NULL,
  `location` varchar(150) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`office_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offices`
--

LOCK TABLES `offices` WRITE;
/*!40000 ALTER TABLE `offices` DISABLE KEYS */;
INSERT INTO `offices` VALUES (1,'Office3','tiruppur',0,NULL,'2026-02-25 09:26:59','2026-02-25 09:26:59');
/*!40000 ALTER TABLE `offices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_stock`
--

DROP TABLE IF EXISTS `product_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_stock` (
  `stock_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `office_id` int DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT '0.00',
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stock_id`),
  KEY `product_id` (`product_id`),
  KEY `office_id` (`office_id`),
  CONSTRAINT `product_stock_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_stock_ibfk_2` FOREIGN KEY (`office_id`) REFERENCES `offices` (`office_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_stock`
--

LOCK TABLES `product_stock` WRITE;
/*!40000 ALTER TABLE `product_stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_employees`
--

DROP TABLE IF EXISTS `production_employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `production_id` int DEFAULT NULL,
  `employee_id` int DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `production_id` (`production_id`),
  KEY `production_employees_user_fk` (`employee_id`),
  CONSTRAINT `production_employees_ibfk_1` FOREIGN KEY (`production_id`) REFERENCES `production_log` (`production_id`) ON DELETE CASCADE,
  CONSTRAINT `production_employees_user_fk` FOREIGN KEY (`employee_id`) REFERENCES `Users` (`userid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_employees`
--

LOCK TABLES `production_employees` WRITE;
/*!40000 ALTER TABLE `production_employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `production_employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_log`
--

DROP TABLE IF EXISTS `production_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_log` (
  `production_id` int NOT NULL AUTO_INCREMENT,
  `office_id` int DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `unit_produced` decimal(10,2) DEFAULT NULL,
  `cement_used` decimal(10,2) DEFAULT NULL,
  `production_date` date DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cement_product_id` int DEFAULT NULL,
  PRIMARY KEY (`production_id`),
  KEY `office_id` (`office_id`),
  KEY `product_id` (`product_id`),
  KEY `production_log_cement_product_id_foreign_idx` (`cement_product_id`),
  CONSTRAINT `production_log_cement_product_id_foreign_idx` FOREIGN KEY (`cement_product_id`) REFERENCES `products` (`product_id`) ON DELETE SET NULL,
  CONSTRAINT `production_log_ibfk_1` FOREIGN KEY (`office_id`) REFERENCES `offices` (`office_id`) ON DELETE CASCADE,
  CONSTRAINT `production_log_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_log`
--

LOCK TABLES `production_log` WRITE;
/*!40000 ALTER TABLE `production_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `production_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `product_name` varchar(150) NOT NULL,
  `category` enum('bricks','sand','cement') NOT NULL,
  `image_url` text,
  `description` text,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SequelizeMeta`
--

LOCK TABLES `SequelizeMeta` WRITE;
/*!40000 ALTER TABLE `SequelizeMeta` DISABLE KEYS */;
INSERT INTO `SequelizeMeta` VALUES ('20260108053415-create-user.js'),('20260108154928-create-vehicle.js'),('20260108163048-add-reset-password-fields-to-users.js'),('20260109043333-add-imageurl-userrole-to-users.js'),('20260109043805-add-isdeleted-to-users.js'),('20260110041125-add-aadhar-and-driving-licence-to-users.js'),('20260110082527-add-kilometer-and-isActive-to-vehicles.js'),('20260110083919-create-vehicle-services-table.js'),('20260110085211-create-bunks-table.js'),('20260110090301-create-vehicle-fuel.js'),('20260110091356-create-bunk-statements.js'),('20260110093527-make-vehicleId-nullable.js'),('20260112175841-add_vehicle_images.js'),('20260116125416-add_driving_licence_back_and_validity.js'),('20260116152511-add-vehicle-image-to-vehicles.js'),('20260120034953-add-owner-and-phone-to-bunks.js'),('20260120042414-add-isVerified-to-vehicleFuel.js'),('20260120062839-create-bank-details.js'),('20260121035247-create-fuel-statement-table.js'),('20260121043250-create-service-shop.js'),('20260128080548-add-service-shop-id-to-vehicle-services.js'),('20260216084817-create-contact-info.js'),('20260216084958-add-isviewed-to-contactinfos.js'),('20260216091705-add-banktransfer-phonepe-to-bank-details.js'),('20260216133212-add-payment-mode-description.js'),('20260217052526-create-service-statement.js'),('20260217063412-create-attendance.js'),('20260217090149-create-wallet-transaction.js'),('20260217131007-add-staffRole-to-users.js'),('20260218215901-create-offices.js'),('20260218215902-create-products.js'),('20260218215903-create-employees.js'),('20260218215904-create-product-stock.js'),('20260218215905-create-production-log.js'),('20260218215906-create-production-employees.js'),('20260218231000-update-production-employees-fk.js'),('20260219104634-create-materials.js'),('20260219111500-add-cement-product-id-to-production-log.js'),('20260219130453-add-options-to-material-supplier-fields.js'),('20260225141000-create-notepads.js'),('20260225150000-add-filename-to-notepads.js');
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_shop`
--

DROP TABLE IF EXISTS `service_shop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_shop` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shop_name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `amount` int NOT NULL DEFAULT '0',
  `type` enum('showroom','paint','tyre','others') NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_shop`
--

LOCK TABLES `service_shop` WRITE;
/*!40000 ALTER TABLE `service_shop` DISABLE KEYS */;
INSERT INTO `service_shop` VALUES (1,'Jr Aligment','Testing','Owner name','12345678233',0,'showroom','2026-02-25 08:16:01','2026-02-25 08:16:01');
/*!40000 ALTER TABLE `service_shop` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_statement`
--

DROP TABLE IF EXISTS `service_statement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_statement` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service_shop_id` int NOT NULL,
  `bank_id` int NOT NULL,
  `amount` int NOT NULL,
  `payment_mode` varchar(255) NOT NULL,
  `description` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `service_shop_id` (`service_shop_id`),
  KEY `bank_id` (`bank_id`),
  CONSTRAINT `service_statement_ibfk_1` FOREIGN KEY (`service_shop_id`) REFERENCES `service_shop` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `service_statement_ibfk_2` FOREIGN KEY (`bank_id`) REFERENCES `bank_details` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_statement`
--

LOCK TABLES `service_statement` WRITE;
/*!40000 ALTER TABLE `service_statement` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_statement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `userid` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phoneNumber` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `amount` float DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpires` datetime DEFAULT NULL,
  `imageUrl` varchar(255) DEFAULT NULL,
  `userRole` int NOT NULL DEFAULT '3' COMMENT '1=Admin, 2=Driver, 3=Customer',
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `aadharUrl` varchar(255) DEFAULT NULL,
  `drivingLicenceUrl` varchar(255) DEFAULT NULL,
  `drivingLicenceBackUrl` varchar(255) DEFAULT NULL,
  `drivingLicenceValidity` datetime DEFAULT NULL,
  `staffRole` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`userid`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES (1,'Aswath','aswath@gmail.com','9876543210','$2b$10$SKVCf0uPQC1Edxlxd8QLB.S2VjC/W09mT/RYJNdhyD3ImIJbHtvvi',0,'2026-02-25 06:20:25','2026-02-25 06:37:48',NULL,NULL,'/images/1772001468186-223714981.jpeg',1,0,'/images/1772001425802-995136629.jpeg','/images/1772001429487-138284507.jpeg','/images/1772001460707-364170492.jpeg','2026-02-28 00:00:00',NULL);
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_fuels`
--

DROP TABLE IF EXISTS `vehicle_fuels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_fuels` (
  `fuelId` int NOT NULL AUTO_INCREMENT,
  `vehicleId` int NOT NULL,
  `bunkId` int NOT NULL,
  `volume` float NOT NULL,
  `amount` float NOT NULL,
  `date` datetime NOT NULL,
  `kilometer` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isVerified` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`fuelId`),
  KEY `vehicleId` (`vehicleId`),
  KEY `bunkId` (`bunkId`),
  CONSTRAINT `vehicle_fuels_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vehicle_fuels_ibfk_2` FOREIGN KEY (`bunkId`) REFERENCES `bunks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_fuels`
--

LOCK TABLES `vehicle_fuels` WRITE;
/*!40000 ALTER TABLE `vehicle_fuels` DISABLE KEYS */;
INSERT INTO `vehicle_fuels` VALUES (1,1,1,50,500,'2026-02-25 00:00:00',72000,'2026-02-25 08:13:47','2026-02-25 08:13:52',1);
/*!40000 ALTER TABLE `vehicle_fuels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_services`
--

DROP TABLE IF EXISTS `vehicle_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicleId` int NOT NULL,
  `serviceId` int NOT NULL,
  `topic` varchar(255) NOT NULL,
  `description` text,
  `date` datetime NOT NULL,
  `service_img` varchar(255) DEFAULT NULL,
  `amount` int NOT NULL DEFAULT '0',
  `kilometer` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `serviceShopId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vehicleId` (`vehicleId`),
  KEY `vehicle_services_serviceShopId_foreign_idx` (`serviceShopId`),
  CONSTRAINT `vehicle_services_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `vehicle_services_serviceShopId_foreign_idx` FOREIGN KEY (`serviceShopId`) REFERENCES `service_shop` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_services`
--

LOCK TABLES `vehicle_services` WRITE;
/*!40000 ALTER TABLE `vehicle_services` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehicle_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicleName` varchar(255) NOT NULL,
  `vehicleNumber` varchar(255) NOT NULL,
  `insurance` datetime NOT NULL,
  `pollution` datetime NOT NULL,
  `rcDate` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `kilometer` int NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `rcImage` varchar(255) DEFAULT NULL,
  `insuranceImage` varchar(255) DEFAULT NULL,
  `pollutionImage` varchar(255) DEFAULT NULL,
  `speedImage` varchar(255) DEFAULT NULL,
  `vehicleImage` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicleNumber` (`vehicleNumber`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
INSERT INTO `vehicles` VALUES (1,'Eicher 1055','TN39BL1288','2026-02-26 00:00:00','2026-02-26 00:00:00','2026-02-26 00:00:00','2026-02-25 08:12:37','2026-02-25 08:13:47',72000,1,'/images/1772007157190-551406070.jpeg','/images/1772007157191-213009515.jpeg','/images/1772007157192-251340864.jpeg','/images/1772007157198-286419779.jpeg','/images/1772007157188-917871542.jpeg');
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WalletTransactions`
--

DROP TABLE IF EXISTS `WalletTransactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WalletTransactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userid` int NOT NULL,
  `bank_id` int NOT NULL,
  `amount` float NOT NULL,
  `type` enum('received','sent') DEFAULT NULL,
  `category` enum('salary','advance') DEFAULT NULL,
  `paymentType` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date` datetime NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userid` (`userid`),
  KEY `bank_id` (`bank_id`),
  CONSTRAINT `wallettransactions_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `Users` (`userid`) ON DELETE CASCADE,
  CONSTRAINT `wallettransactions_ibfk_2` FOREIGN KEY (`bank_id`) REFERENCES `bank_details` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WalletTransactions`
--

LOCK TABLES `WalletTransactions` WRITE;
/*!40000 ALTER TABLE `WalletTransactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `WalletTransactions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-25 15:06:20
