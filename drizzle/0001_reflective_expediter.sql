CREATE TABLE `agentActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`agentType` varchar(100) NOT NULL,
	`activityType` enum('status_update','message','content_generated') NOT NULL,
	`message` text,
	`status` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agentActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brandProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`industry` varchar(255),
	`description` text,
	`productService` text,
	`targetAudience` text,
	`brandVoice` enum('professional','casual','friendly','authoritative') DEFAULT 'professional',
	`valuePropositions` text,
	`competitors` text,
	`marketingGoals` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brandProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`brandProfileId` int NOT NULL,
	`goal` text NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`strategy` text,
	`estimatedReach` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generatedContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`agentType` enum('blog','youtube','video_shorts','medium','linkedin','reddit','twitter','quora','pinterest','podcast') NOT NULL,
	`platform` varchar(100) NOT NULL,
	`contentType` varchar(100),
	`title` text,
	`body` text NOT NULL,
	`metadata` text,
	`estimatedReach` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generatedContent_id` PRIMARY KEY(`id`)
);
