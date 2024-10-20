/*
  Warnings:

  - Added the required column `owner` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "owner" TEXT NOT NULL;
