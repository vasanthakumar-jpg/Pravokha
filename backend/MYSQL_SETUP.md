# MySQL Setup Guide for Windows

## Problem
`Error: P1001: Can't reach database server at localhost:3306`

This means MySQL is not running on your Windows machine.

## Solutions (Choose ONE)

### Option 1: Start MySQL Service (If Already Installed)

1. **Open Services** (Press `Win + R`, type `services.msc`, press Enter)
2. **Find MySQL** service (usually named `MySQL80` or `MySQL`)
3. **Right-click** → **Start**

OR use Command Prompt (as Administrator):
```powershell
net start MySQL80
```

---

### Option 2: Install MySQL (If Not Installed)

#### Download & Install
1. Go to: https://dev.mysql.com/downloads/installer/
2. Download **MySQL Installer for Windows**
3. Run installer and select:
   - MySQL Server
   - MySQL Workbench (optional, for GUI)
4. During setup:
   - Set root password to: `root` (to match your .env file)
   - Port: `3306` (default)

#### After Installation
```powershell
net start MySQL80
```

---

### Option 3: Use XAMPP (Easiest for Development)

1. **Download XAMPP**: https://www.apachefriends.org/download.html
2. **Install** and open XAMPP Control Panel
3. **Click "Start"** next to MySQL
4. **Update your .env** if needed:
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/pravokha"
   ```
   (XAMPP MySQL has no password by default)

---

### Option 4: Use Docker (Recommended for Isolation)

```powershell
# Pull and run MySQL container
docker run --name pravokha-mysql ^
  -e MYSQL_ROOT_PASSWORD=root ^
  -e MYSQL_DATABASE=pravokha ^
  -p 3306:3306 ^
  -d mysql:8.0

# Check if running
docker ps
```

---

## After MySQL is Running

1. **Verify Connection**:
   ```powershell
   cd backend
   npx prisma db push
   ```

2. **Expected Output**:
   ```
   ✔ Database synchronized with Prisma schema
   ```

3. **Regenerate Prisma Client** (if needed):
   ```powershell
   npx prisma generate
   ```

4. **All TypeScript errors will disappear** once the database is synchronized!

---

## Quick Check: Is MySQL Running?

### Test Connection Manually
```powershell
mysql -u root -p -h localhost -P 3306
# Enter password: root
```

If you get `mysql>` prompt, MySQL is running ✅

---

## Next Steps After MySQL is Running

```powershell
cd backend

# 1. Apply schema changes
npm run prisma:push

# 2. Seed test data
npx ts-node src/utils/seed-test-data.ts

# 3. Start backend
npm run dev
```

---

## Common Issues

### Port 3306 Already in Use
```powershell
netstat -ano | findstr :3306
# Kill the process or change port in .env
```

### Can't Connect After Starting Service
- Check firewall settings
- Verify MySQL is bound to 0.0.0.0 not 127.0.0.1
- Try restarting the MySQL service
