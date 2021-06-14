CREATE DATABASE IF NOT EXISTS `daily_money_tracker`;
USE `daily_money_tracker`;

DROP TABLE IF EXISTS `record`;
CREATE TABLE `record` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(25) NOT NULL,
  `income` int(11) NOT NULL,
  `expense` int(11) NOT NULL,
  `date` varchar(25) NOT NULL,
  `invoice` varchar(255),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (id)
);

INSERT INTO `record` (`category`, `income`, `expense`, `date`, `invoice`, `createdAt`, `updatedAt`) VALUES
('Food', '0', '20000', '2021/06/14', 'inv_ex.png', '2021-06-14 13:55:00', '2021-06-14 13:57:30');