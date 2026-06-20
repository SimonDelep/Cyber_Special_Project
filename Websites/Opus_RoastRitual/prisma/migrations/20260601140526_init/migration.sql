-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('COFFEE', 'TEA');

-- CreateEnum
CREATE TYPE "SubscriptionInterval" AS ENUM ('MONTHLY', 'QUARTERLY');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "origin" TEXT,
    "roastLevel" TEXT,
    "isEthical" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionBox" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tagline" TEXT,
    "priceCents" INTEGER NOT NULL,
    "interval" "SubscriptionInterval" NOT NULL DEFAULT 'MONTHLY',
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionBoxItem" (
    "id" TEXT NOT NULL,
    "subscriptionBoxId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SubscriptionBoxItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionBox_slug_key" ON "SubscriptionBox"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionBoxItem_subscriptionBoxId_productId_key" ON "SubscriptionBoxItem"("subscriptionBoxId", "productId");

-- AddForeignKey
ALTER TABLE "SubscriptionBoxItem" ADD CONSTRAINT "SubscriptionBoxItem_subscriptionBoxId_fkey" FOREIGN KEY ("subscriptionBoxId") REFERENCES "SubscriptionBox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionBoxItem" ADD CONSTRAINT "SubscriptionBoxItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
