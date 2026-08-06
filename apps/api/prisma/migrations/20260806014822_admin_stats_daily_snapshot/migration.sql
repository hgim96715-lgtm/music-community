-- CreateEnum
CREATE TYPE "AdminStatsMetric" AS ENUM ('recommendations', 'signups', 'active');

-- CreateTable
CREATE TABLE "AdminStatsDailySnapshot" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "metric" "AdminStatsMetric" NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AdminStatsDailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminStatsDailySnapshot_metric_date_idx" ON "AdminStatsDailySnapshot"("metric", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AdminStatsDailySnapshot_date_hour_metric_key" ON "AdminStatsDailySnapshot"("date", "hour", "metric");
