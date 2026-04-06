CREATE DATABASE IF NOT EXISTS insurance_db;
USE insurance_db;

-- Drop in correct order
DROP TABLE IF EXISTS Claim;
DROP TABLE IF EXISTS Transaction_;
DROP TABLE IF EXISTS Premium;
DROP TABLE IF EXISTS PolicyHolder;
DROP TABLE IF EXISTS Policy;
DROP TABLE IF EXISTS PolicyType;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS users;

-- Users table for JWT auth
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    customer_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE PolicyType (
    policy_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL,
    coverage_amount DECIMAL(12,2) NOT NULL,
    rules TEXT,
    time_period INT NOT NULL COMMENT 'Duration in months'
);

CREATE TABLE Policy (
    policy_id INT AUTO_INCREMENT PRIMARY KEY,
    policy_type_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    FOREIGN KEY (policy_type_id) REFERENCES PolicyType(policy_type_id)
);

CREATE TABLE PolicyHolder (
    customer_id INT NOT NULL,
    policy_id INT NOT NULL,
    PRIMARY KEY (customer_id, policy_id),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (policy_id) REFERENCES Policy(policy_id)
);

CREATE TABLE Premium (
    premium_id INT AUTO_INCREMENT PRIMARY KEY,
    policy_id INT NOT NULL,
    date DATE NOT NULL,
    premium_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending','paid','overdue') NOT NULL DEFAULT 'pending',
    FOREIGN KEY (policy_id) REFERENCES Policy(policy_id)
);

CREATE TABLE Transaction_ (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    premium_id INT NOT NULL,
    transaction_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('success','failed','pending') NOT NULL DEFAULT 'success',
    FOREIGN KEY (premium_id) REFERENCES Premium(premium_id)
);

CREATE TABLE Claim (
    claim_id INT AUTO_INCREMENT PRIMARY KEY,
    policy_id INT NOT NULL,
    claim_date DATE NOT NULL,
    claim_amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    description TEXT,
    FOREIGN KEY (policy_id) REFERENCES Policy(policy_id)
);

-- ─── VIEWS ───────────────────────────────────────────────
CREATE OR REPLACE VIEW v_customer_policy_summary AS
SELECT
    c.customer_id,
    c.name AS customer_name,
    c.email,
    p.policy_id,
    pt.type_name,
    pt.coverage_amount,
    p.start_date,
    p.end_date
FROM Customer c
JOIN PolicyHolder ph ON c.customer_id = ph.customer_id
JOIN Policy p ON ph.policy_id = p.policy_id
JOIN PolicyType pt ON p.policy_type_id = pt.policy_type_id;

-- ─── TRIGGERS ────────────────────────────────────────────
DELIMITER $$

CREATE TRIGGER trg_auto_pay_premium
AFTER INSERT ON Transaction_
FOR EACH ROW
BEGIN
    IF NEW.status = 'success' THEN
        UPDATE Premium SET status = 'paid' WHERE premium_id = NEW.premium_id;
    END IF;
END$$

CREATE TRIGGER trg_overdue_check
BEFORE UPDATE ON Premium
FOR EACH ROW
BEGIN
    IF NEW.status = 'pending' AND NEW.date < CURDATE() THEN
        SET NEW.status = 'overdue';
    END IF;
END$$

-- ─── STORED PROCEDURES ───────────────────────────────────
CREATE PROCEDURE generate_premiums(IN p_policy_id INT, IN monthly_amount DECIMAL(10,2))
BEGIN
    DECLARE v_start DATE;
    DECLARE v_end DATE;
    DECLARE v_cur DATE;
    SELECT start_date, end_date INTO v_start, v_end FROM Policy WHERE policy_id = p_policy_id;
    SET v_cur = v_start;
    WHILE v_cur <= v_end DO
        INSERT INTO Premium (policy_id, date, premium_amount, status)
        VALUES (p_policy_id, v_cur, monthly_amount, 'pending');
        SET v_cur = DATE_ADD(v_cur, INTERVAL 1 MONTH);
    END WHILE;
END$$

-- ─── FUNCTIONS ───────────────────────────────────────────
CREATE FUNCTION total_claimed(p_customer_id INT)
RETURNS DECIMAL(12,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total DECIMAL(12,2);
    SELECT COALESCE(SUM(cl.claim_amount), 0)
    INTO total
    FROM Claim cl
    JOIN PolicyHolder ph ON cl.policy_id = ph.policy_id
    WHERE ph.customer_id = p_customer_id AND cl.status = 'approved';
    RETURN total;
END$$

DELIMITER ;

-- ─── SEED DATA ────────────────────────────────────────────
INSERT INTO PolicyType (type_name, coverage_amount, rules, time_period) VALUES
('Health Basic',    500000.00, 'Covers hospitalization and surgery up to coverage amount. Pre-existing conditions excluded for first year.', 12),
('Health Premium',  1500000.00,'Full health coverage including pre-existing conditions, dental, and vision.', 24),
('Term Life',       2500000.00,'Life cover for term period. No maturity benefit. Nominee receives sum assured on death.', 120),
('Vehicle Third Party', 100000.00, 'Covers third-party liability only. Does not cover own vehicle damage.', 12),
('Vehicle Comprehensive', 300000.00, 'Covers own damage, theft, and third-party liability.', 12);

INSERT INTO Customer (name, phone, email) VALUES
('Avleen Kaur',   '9876543210', 'avleen@example.com'),
('Rishab Kumar',  '9123456780', 'rishab@example.com'),
('Daksh Kohli',   '9012345678', 'daksh@example.com'),
('Priya Sharma',  '9988776655', 'priya@example.com'),
('Arjun Mehta',   '9871234560', 'arjun@example.com');

INSERT INTO Policy (policy_type_id, start_date, end_date) VALUES
(1, '2024-01-01', '2025-01-01'),
(2, '2024-03-01', '2026-03-01'),
(3, '2023-06-01', '2033-06-01'),
(4, '2024-07-01', '2025-07-01'),
(5, '2024-02-01', '2025-02-01'),
(1, '2024-05-01', '2025-05-01'),
(3, '2023-01-01', '2033-01-01');

INSERT INTO PolicyHolder (customer_id, policy_id) VALUES
(1, 1),(1, 3),
(2, 2),(2, 4),
(3, 5),(3, 6),
(4, 3),(4, 7),
(5, 1),(5, 2);

INSERT INTO Premium (policy_id, date, premium_amount, status) VALUES
(1, '2024-01-01', 2500.00, 'paid'),
(1, '2024-02-01', 2500.00, 'paid'),
(1, '2024-03-01', 2500.00, 'paid'),
(1, '2024-04-01', 2500.00, 'overdue'),
(2, '2024-03-01', 6000.00, 'paid'),
(2, '2024-04-01', 6000.00, 'paid'),
(2, '2024-05-01', 6000.00, 'pending'),
(3, '2024-01-01', 8000.00, 'paid'),
(3, '2024-02-01', 8000.00, 'paid'),
(4, '2024-07-01', 1200.00, 'paid'),
(5, '2024-02-01', 4500.00, 'paid'),
(6, '2024-05-01', 2500.00, 'paid'),
(6, '2024-06-01', 2500.00, 'pending');

INSERT INTO Transaction_ (premium_id, transaction_date, amount, status) VALUES
(1, '2024-01-02', 2500.00, 'success'),
(2, '2024-02-03', 2500.00, 'success'),
(3, '2024-03-01', 2500.00, 'success'),
(5, '2024-03-02', 6000.00, 'success'),
(6, '2024-04-01', 6000.00, 'success'),
(8, '2024-01-02', 8000.00, 'success'),
(9, '2024-02-01', 8000.00, 'success'),
(10,'2024-07-02', 1200.00, 'success'),
(11,'2024-02-02', 4500.00, 'success'),
(12,'2024-05-02', 2500.00, 'success');

INSERT INTO Claim (policy_id, claim_date, claim_amount, status, description) VALUES
(1, '2024-03-15', 45000.00, 'approved',  'Hospitalization for appendix surgery'),
(2, '2024-04-20', 120000.00,'pending',   'Cardiac treatment claim'),
(3, '2024-02-10', 500000.00,'rejected',  'Claim rejected: policy exclusion clause'),
(5, '2024-03-01', 80000.00, 'approved',  'Vehicle damage from accident'),
(1, '2024-05-10', 30000.00, 'pending',   'Outpatient treatment'),
(4, '2024-08-01', 15000.00, 'approved',  'Third-party property damage');

-- Passwords: admin123 / user123 (bcrypt hashed — will be set by init script)
-- We seed plain references here; the Python init script inserts hashed versions
