"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";

export async function updateUser(data) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: clerkUser.id },
  });

  if (!user) throw new Error("User not found");

  try {
    const result = await db.$transaction(
      async (tx) => {
        let industryInsight = await tx.industryInsight.findUnique({
          where: {
            industry: data.industry,
          },
        });

        if (!industryInsight) {
          const insights = await generateAIInsights(data.industry);

          industryInsight = await tx.industryInsight.create({
            data: {
              industry: data.industry,
              ...insights,
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        }

        const updatedUser = await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            industry: data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
        });

        return { updatedUser, industryInsight };
      },
      {
        timeout: 10000,
      }
    );

    revalidatePath("/");
    return { success: true, ...result };
  } catch (error) {
    console.error("Error updating user and industry:", error.message);
    throw new Error("Failed to update profile");
  }
}

export async function getUserOnboardingStatus() {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: clerkUser.id },
  });

  if (!user) throw new Error("User not found");

  try {
    const userData = await db.user.findUnique({
      where: {
        clerkUserId: clerkUser.id,
      },
      select: {
        industry: true,
      },
    });

    return {
      isOnboarded: !!userData?.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error.message);
    throw new Error("Failed to check onboarding status" + error.message);
  }
}
