# Render build script for AgriNova backend
# Render calls this automatically as the build command

npm install
npx prisma generate
npm run build
