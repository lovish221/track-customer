CREATE TABLE Contact (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phoneNumber VARCHAR(20),
  email VARCHAR(255),
  linkedId INT,
  linkPrecedence ENUM('primary', 'secondary'),
  createdAt DATETIME,
  updatedAt DATETIME,
  deletedAt DATETIME
);