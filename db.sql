-- Active: 1694968820112@@127.0.0.1@3306@cardgame
CREATE DATABASE IF NOT EXISTS cardgame;


CREATE USER IF NOT EXISTS 'mtkachov'@'localhost' IDENTIFIED BY 'securepass';
GRANT ALL PRIVILEGES ON cardgame.* TO 'mtkachov'@'localhost';

USE cardgame;

CREATE TABLE IF NOT EXISTS users(
    id INT PRIMARY KEY AUTO_INCREMENT,
    login VARCHAR(50) NOT NULL UNIQUE,
    password TEXT(25) NOT NULL,
    name TEXT(200) NOT NULL,
    email VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS cards(
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL UNIQUE,
    hp INT NOT NULL,
    attack INT NOT NULL,
    cost INT NOT NULL,
    avatharFile VARCHAR(255) NOT NULL
);

INSERT IGNORE INTO cards (id, name, hp, attack, cost, avatharFile) VALUES
(1, 'Gamamaru', 1, 1, 1, 'frog1.jpg'),
(2, 'Gamakichi', 2, 2, 2, 'frog2.jpg'),
(3, 'Gamabunta', 3, 3, 3, 'frog3.jpg'),
(4, 'Izanami', 10, 5, 3, 'izanami.png'),
(5, 'Izanagi', 5, 10, 3, 'izanagi.png'),
(6, 'Yebisu', 5, 5, 2, 'yebisu.png'),
(7, 'Kagutsuchi', 1, 25, 5, 'kagutsuchi.png'),
(8, 'Amaterasu', 15, 15, 6, 'amaterasu.png'),
(9, 'Tsukuyomi', 20, 5, 5, 'tsukuyomi.png'),
(10, 'Susanoo', 14, 7, 4, 'susanoo.png'),
(11, 'Futen', 5, 5, 1, 'futen.png'),
(12, 'Raijin', 3, 18, 4, 'raijin.png'),
(13, 'Uzume', 7, 3, 2, 'ame-no-uzume.png'),
(14, 'Hachiman', 14, 6, 3, 'hachiman.png'),
(15, 'Inari', 6, 4, 1, 'inari.png'),
(16, 'Jizo', 20, 1, 4, 'jizo.png'),
(17, 'Benzaiten', 4, 4, 1, 'benzaiten.png'),
(18, 'Daikokuten', 11, 6, 3, 'daikokuten.png'),
(19, 'Fukurokuju', 5, 5, 2, 'fukurokuju.png'),
(20, 'Jade Hare', 10, 3, 3, 'jade_hare.png'),
(21, 'Kitsune', 3, 3, 1, 'kitsune.png'),
(22, 'Nekomata', 9, 9, 3, 'nekomata.png'),
(23, 'Sake', 50, 50, 10, 'sake.png');
