import mysql from 'mysql2/promise';

const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '4000');
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_DATABASE = process.env.MYSQL_DATABASE;

let pool: mysql.Pool | null = null;

export async function connectToMySQL() {
  if (pool) {
    return pool;
  }

  // Validate required environment variables
  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    throw new Error('Missing required database environment variables. Please check MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE.');
  }

  try {
    pool = mysql.createPool({
      host: MYSQL_HOST,
      port: MYSQL_PORT,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.NODE_ENV === 'production' ? {} : {
        rejectUnauthorized: false,
      },
    });

    console.log('✅ Connected to MySQL');
    return pool;
  } catch (error) {
    console.error('❌ MySQL connection error:', error);
    throw error;
  }
}

export async function initMySQLTables() {
  const connection = await connectToMySQL();

  // Create users table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      role ENUM('admin', 'customer') DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Create orders table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(255) PRIMARY KEY,
      service_slug VARCHAR(255) NOT NULL,
      service_title VARCHAR(255) NOT NULL,
      size VARCHAR(100) NOT NULL,
      gsm VARCHAR(50) NOT NULL,
      quantity INT NOT NULL,
      addons JSON,
      notes TEXT,
      total DECIMAL(10, 2) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(20) NOT NULL,
      order_date DATETIME NOT NULL,
      delivery_date DATETIME,
      status ENUM('pending', 'processing', 'ready', 'delivered') DEFAULT 'pending',
      pickup_scheduled DATETIME,
      payment_status ENUM('pending', 'partially_paid', 'paid', 'failed') DEFAULT 'pending',
      transaction_id VARCHAR(255),
      payment_date DATETIME,
      advance_paid DECIMAL(10, 2),
      remaining_amount DECIMAL(10, 2),
      files JSON,
      delivery_option ENUM('pickup', 'delivery'),
      delivery_address JSON,
      otp VARCHAR(10),
      otp_expiry DATETIME,
      otp_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_customer_email (customer_email),
      INDEX idx_status (status),
      INDEX idx_payment_status (payment_status),
      INDEX idx_order_date (order_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Create payments table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(255) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      payment_type ENUM('advance', 'full', 'remaining') NOT NULL,
      transaction_id VARCHAR(255),
      payment_date DATETIME NOT NULL,
      status ENUM('pending', 'completed', 'failed') NOT NULL,
      payment_method VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_order_id (order_id),
      INDEX idx_transaction_id (transaction_id),
      INDEX idx_status (status),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Create chat_messages table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(255) PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      sender ENUM('customer', 'admin') NOT NULL,
      text TEXT NOT NULL,
      timestamp BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_session_id (session_id),
      INDEX idx_timestamp (timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Create default admin user if not exists
  await connection.execute(`
    INSERT IGNORE INTO users (id, email, name, phone, role)
    VALUES ('admin-1', 'admin@printshop.com', 'Admin', '8904467535', 'admin')
  `);

  console.log('✅ MySQL tables initialized');
}

export default connectToMySQL;
