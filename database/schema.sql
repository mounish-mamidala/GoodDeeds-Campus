CREATE DATABASE IF NOT EXISTS gooddeeds_campus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gooddeeds_campus;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('STUDENT','ADMIN') NOT NULL DEFAULT 'STUDENT',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS opportunities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  location VARCHAR(160) NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NULL,
  duration_hours DECIMAL(5,2) NOT NULL DEFAULT 2,
  available_slots INT NOT NULL DEFAULT 10,
  organizer VARCHAR(120) NOT NULL DEFAULT 'GoodDeeds Campus',
  image_url VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  opportunity_id INT NOT NULL,
  status ENUM('JOINED','APPROVED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'JOINED',
  hours_awarded DECIMAL(5,2) NOT NULL DEFAULT 0,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_registration_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_registration_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
  CONSTRAINT uq_user_opportunity UNIQUE (user_id, opportunity_id)
);

INSERT INTO opportunities (title,description,category,location,event_date,start_time,duration_hours,available_slots,organizer)
SELECT 'Beach Cleanup Drive','Clean the shoreline, segregate waste and spread awareness about protecting marine ecosystems.','Environment','Marina Beach, Chennai','2027-01-17','07:00:00',3,35,'Green Campus Club'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE title='Beach Cleanup Drive');

INSERT INTO opportunities (title,description,category,location,event_date,start_time,duration_hours,available_slots,organizer)
SELECT 'Weekend Teaching Support','Help school students practice reading, mathematics and computer fundamentals.','Education','Community Learning Centre, Chennai','2027-01-24','09:30:00',2,18,'Campus Outreach'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE title='Weekend Teaching Support');

INSERT INTO opportunities (title,description,category,location,event_date,start_time,duration_hours,available_slots,organizer)
SELECT 'Community Food Packing','Pack essential grocery kits with a local community group for distribution.','Community','T. Nagar, Chennai','2027-02-01','10:00:00',2.5,24,'ServeTogether'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE title='Community Food Packing');

INSERT INTO opportunities (title,description,category,location,event_date,start_time,duration_hours,available_slots,organizer)
SELECT 'Campus Blood Donation Camp Support','Help with registrations, queue management and donor guidance. Volunteers do not perform medical tasks.','Health','College Campus, Chennai','2027-02-08','08:30:00',4,12,'Student Welfare Cell'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE title='Campus Blood Donation Camp Support');
