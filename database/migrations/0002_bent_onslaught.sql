ALTER TABLE "targets" ADD COLUMN "search_keyword_a" text;--> statement-breakpoint
ALTER TABLE "targets" ADD COLUMN "search_keyword_b" text;--> statement-breakpoint
UPDATE "targets" SET "search_keyword_a" = 'apple watch se 第2世代 44mm gps', "search_keyword_b" = 'apple watch se2 44mm gps' WHERE "id" = 'target_apple_watch_se2_44';--> statement-breakpoint
UPDATE "targets" SET "search_keyword_a" = 'apple watch se 第2世代 40mm gps', "search_keyword_b" = 'apple watch se2 40mm gps' WHERE "id" = 'target_apple_watch_se2_40';--> statement-breakpoint
UPDATE "targets" SET "search_keyword_a" = 'apple watch series 8 45mm gps', "search_keyword_b" = 'apple watch8 45mm gps' WHERE "id" = 'target_apple_watch_s8_45';--> statement-breakpoint
UPDATE "targets" SET "search_keyword_a" = 'apple watch series 8 41mm gps', "search_keyword_b" = 'apple watch8 41mm gps' WHERE "id" = 'target_apple_watch_s8_41';--> statement-breakpoint
UPDATE "targets" SET "search_keyword_a" = 'sony ヘッドホン wh-1000xm5', "search_keyword_b" = 'wh-1000xm5' WHERE "id" = 'target_wh1000xm5';--> statement-breakpoint
UPDATE "targets" SET "search_keyword_a" = 'nintendo switch lite 本体', "search_keyword_b" = 'switch lite 本体' WHERE "id" = 'target_switch_lite';--> statement-breakpoint
UPDATE "targets" SET "search_keyword_a" = 'nintendo switch 有機elモデル 本体', "search_keyword_b" = 'switch 有機el 本体' WHERE "id" = 'target_switch_oled';--> statement-breakpoint
UPDATE "targets" SET "search_keyword_a" = 'google pixel 7a 128gb 本体', "search_keyword_b" = 'pixel7a 128gb' WHERE "id" = 'target_pixel7a_128';--> statement-breakpoint
UPDATE "targets" SET "search_keyword_a" = 'iphone 13 128gb simフリー 本体', "search_keyword_b" = 'iphone13 simフリー 128gb' WHERE "id" = 'target_iphone13_128_simfree';--> statement-breakpoint
UPDATE "targets" SET "search_keyword_a" = 'iphone 13 mini 128gb simフリー 本体', "search_keyword_b" = 'iphone13mini simフリー 128gb' WHERE "id" = 'target_iphone13mini_128_simfree';