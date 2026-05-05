#!/bin/bash

# Salesly 2.0 Setup Script

echo "🚀 Salesly 2.0 - Initial Setup"
echo "================================"
echo ""

# Check Node version
echo "✓ Checking Node.js version..."
node --version
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Create .env.local from template
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local from template..."
  cp .env.example .env.local
  echo "✓ Created .env.local (please fill in your Supabase credentials)"
else
  echo "✓ .env.local already exists"
fi
echo ""

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add your Supabase credentials to .env.local"
echo "2. Set up Google OAuth in Supabase"
echo "3. Create database tables (see roadmap.md)"
echo "4. Run 'npm run dev' to start"
echo ""
