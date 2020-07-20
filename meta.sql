SET autocommit=0;SET GLOBAL log_bin_trust_function_creators = 1;SET unique_checks=0;SET foreign_key_checks=0;
-- MariaDB dump 10.17  Distrib 10.4.13-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: wopidom
-- ------------------------------------------------------
-- Server version	10.4.13-MariaDB
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;
/*!40101 SET NAMES utf8mb4 */
;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */
;
/*!40103 SET TIME_ZONE='+00:00' */
;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */
;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */
;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */
;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */
;
--
-- Table structure for table `country`
--
DROP TABLE IF EXISTS `country`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `country` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `phone_prefix` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `daily_reward`
--
DROP TABLE IF EXISTS `daily_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `daily_reward` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `type` tinytext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `amount` smallint(6) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `game`
--
DROP TABLE IF EXISTS `game`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `game` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(70) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 ROW_FORMAT = DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `game_user`
--
DROP TABLE IF EXISTS `game_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `game_user` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `first_name` varchar(55) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    `last_name` varchar(55) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    `email` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    `password` varchar(155) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    `device_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
    `created_at` datetime DEFAULT current_timestamp(),
    `modified_at` datetime DEFAULT current_timestamp(),
    `device_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    `device_model` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    `age` smallint(5) unsigned DEFAULT NULL,
    `phone_code` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT '',
    `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '',
    `language_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'en-US',
    `country_phone_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '',
    `is_male` smallint(6) DEFAULT NULL,
    `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
    `zip_code` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '',
    `state` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT '',
    `country` varchar(55) COLLATE utf8mb4_unicode_ci DEFAULT '',
    `city` varchar(75) COLLATE utf8mb4_unicode_ci DEFAULT '',
    PRIMARY KEY (`id`),
    KEY `game_user_language_language_code_fk` (`language_code`),
    CONSTRAINT `game_user_language_language_code_fk` FOREIGN KEY (`language_code`) REFERENCES `language` (`language_code`)
) ENGINE = InnoDB AUTO_INCREMENT = 564 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci AVG_ROW_LENGTH = 8192 ROW_FORMAT = DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `game_user_login`
--
DROP TABLE IF EXISTS `game_user_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `game_user_login` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `date` datetime NOT NULL DEFAULT current_timestamp(),
    `game_user_id` int(10) unsigned NOT NULL,
    `game_id` int(10) unsigned NOT NULL,
    `device_id` varchar(200) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_game_user_login_game_id` (`game_id`),
    KEY `FK_game_user_login_game_user_id` (`game_user_id`),
    CONSTRAINT `FK_game_user_login_game_id` FOREIGN KEY (`game_id`) REFERENCES `game` (`id`),
    CONSTRAINT `FK_game_user_login_game_user_id` FOREIGN KEY (`game_user_id`) REFERENCES `game_user` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 14 DEFAULT CHARSET = utf8mb4 ROW_FORMAT = DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `language`
--
DROP TABLE IF EXISTS `language`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `language` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `language_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
    `texture_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `localization_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UK_language_language_code` (`language_code`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `raffle`
--
DROP TABLE IF EXISTS `raffle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `raffle` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `closing_date` datetime NOT NULL,
    `raffle_number_price` int(10) unsigned NOT NULL,
    `texture_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    `item_highlight` tinyint(1) NOT NULL,
    `winner` int(10) unsigned DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `raffle_game_user_id_fk` (`winner`),
    CONSTRAINT `raffle_game_user_id_fk` FOREIGN KEY (`winner`) REFERENCES `game_user` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 40 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `raffle_history`
--
DROP TABLE IF EXISTS `raffle_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `raffle_history` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `raffle_id` int(11) unsigned NOT NULL,
    `game_user_id` int(11) unsigned NOT NULL,
    `transaction_date` datetime NOT NULL DEFAULT current_timestamp(),
    `tickets` int(11) NOT NULL,
    `closing_date` datetime NOT NULL DEFAULT current_timestamp(),
    `raffle_numbers` int(11) NOT NULL,
    `win` tinyint(1) NOT NULL DEFAULT 0,
    `notified` tinyint(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `raffle_history_game_user_id_fk` (`game_user_id`),
    KEY `raffle_history_raffle_id_fk` (`raffle_id`),
    CONSTRAINT `raffle_history_game_user_id_fk` FOREIGN KEY (`game_user_id`) REFERENCES `game_user` (`id`),
    CONSTRAINT `raffle_history_raffle_id_fk` FOREIGN KEY (`raffle_id`) REFERENCES `raffle` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 68 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `raffle_localization`
--
DROP TABLE IF EXISTS `raffle_localization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `raffle_localization` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `raffle_id` int(10) unsigned NOT NULL,
    `language_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
    `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
    `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_raffle_localiztion_language_language_code` (`language_code`),
    KEY `FK_raffle_localiztion_raffle_id` (`raffle_id`),
    CONSTRAINT `FK_raffle_localiztion_language_language_code` FOREIGN KEY (`language_code`) REFERENCES `language` (`language_code`),
    CONSTRAINT `FK_raffle_localiztion_raffle_id` FOREIGN KEY (`raffle_id`) REFERENCES `raffle` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 32 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `raffle_wins`
--
DROP TABLE IF EXISTS `raffle_wins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `raffle_wins` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `raffle_history_id` int(11) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `raffle_wins_raffle_history_id_fk` (`raffle_history_id`),
    CONSTRAINT `raffle_wins_raffle_history_id_fk` FOREIGN KEY (`raffle_history_id`) REFERENCES `raffle_history` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 141 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `state`
--
DROP TABLE IF EXISTS `state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `state` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `country_id` int(11) NOT NULL,
    `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`id`),
    KEY `state_country_id_fk` (`country_id`),
    CONSTRAINT `state_country_id_fk` FOREIGN KEY (`country_id`) REFERENCES `country` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 272 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `user`
--
DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `user` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(55) COLLATE utf8mb4_unicode_ci NOT NULL,
    `email` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'NULL',
    `password` varchar(155) COLLATE utf8mb4_unicode_ci NOT NULL,
    `device_id` int(11) DEFAULT NULL,
    `created_at` datetime DEFAULT current_timestamp(),
    `modified_at` datetime DEFAULT current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
--
-- Table structure for table `pay_table`
--
DROP TABLE IF EXISTS `pay_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `pay_table` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `symbol_id` int(11) unsigned NOT NULL,
    `symbol_amount` int(3) NOT NULL DEFAULT 0,
    `probability` decimal(5, 2) NOT NULL DEFAULT 0.00,
    `points` int(5) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_pay_table_symbol_id` (`symbol_id`),
    CONSTRAINT `FK_pay_table_symbol_id` FOREIGN KEY (`symbol_id`) REFERENCES `symbol` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 24 DEFAULT CHARSET = utf8mb4 ROW_FORMAT = DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `setting`
--
DROP TABLE IF EXISTS `setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `setting` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
    `name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '''NULL''',
    `value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'NULL',
    `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'NULL',
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 35 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `symbol`
--
DROP TABLE IF EXISTS `symbol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `symbol` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `payment_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `texture_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 836 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `wallet`
--
DROP TABLE IF EXISTS `wallet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `wallet` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `game_user_id` int(10) unsigned NOT NULL,
    `coins` int(11) NOT NULL,
    `tickets` int(11) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_wallet_game_user_id` (`game_user_id`),
    CONSTRAINT `FK_wallet_game_user_id` FOREIGN KEY (`game_user_id`) REFERENCES `wopidom`.`game_user` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 562 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */
;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */
;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */
;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */
;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */
;
-- Dump completed on 2020-07-20  9:41:51SET foreign_key_checks=0;SET unique_checks=0;COMMIT;
