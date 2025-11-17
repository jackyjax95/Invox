import { NextRequest, NextResponse } from 'next/server';

interface SocialPostTemplate {
  milestone: number;
  template: string;
  hashtags: string[];
}

const SOCIAL_POST_TEMPLATES: SocialPostTemplate[] = [
  {
    milestone: 1,
    template: "🎉 Just created my first invoice with Smart Invoice! Excited to start this journey. #FirstInvoice #BusinessGrowth",
    hashtags: ["#FirstInvoice", "#BusinessGrowth", "#SmartInvoice"]
  },
  {
    milestone: 5,
    template: "📈 Reached 5 invoices created! Building momentum in my business. Thanks to Smart Invoice for making it easy! #BusinessMilestone #InvoiceManagement",
    hashtags: ["#BusinessMilestone", "#InvoiceManagement", "#GrowingBusiness"]
  },
  {
    milestone: 10,
    template: "🚀 10 invoices down! My business is growing stronger every day. Grateful for tools like Smart Invoice that keep things organized. #BusinessGrowth #EntrepreneurLife",
    hashtags: ["#BusinessGrowth", "#EntrepreneurLife", "#InvoiceSuccess"]
  },
  {
    milestone: 25,
    template: "💪 Quarter century of invoices! 25 invoices created and counting. Smart Invoice has been instrumental in my business success. #BusinessMilestone #SuccessStory",
    hashtags: ["#BusinessMilestone", "#SuccessStory", "#BusinessTools"]
  },
  {
    milestone: 50,
    template: "🎊 50 invoices achieved! What an incredible journey. Smart Invoice has helped me stay organized and professional. Here's to more growth! #BusinessAchievement #InvoiceMaster",
    hashtags: ["#BusinessAchievement", "#InvoiceMaster", "#BusinessSuccess"]
  },
  {
    milestone: 100,
    template: "🌟 Century mark reached! 100 invoices created with Smart Invoice. This platform has been a game-changer for my business operations. #CenturyClub #BusinessExcellence",
    hashtags: ["#CenturyClub", "#BusinessExcellence", "#InvoicePro"]
  }
];

export async function POST(request: NextRequest) {
  try {
    const { milestone, businessName } = await request.json();

    if (!milestone || typeof milestone !== 'number') {
      return NextResponse.json({ error: 'Milestone is required and must be a number' }, { status: 400 });
    }

    // Find the appropriate template for the milestone
    const template = SOCIAL_POST_TEMPLATES.find(t => t.milestone === milestone);

    if (!template) {
      return NextResponse.json({ error: 'No template found for this milestone' }, { status: 404 });
    }

    // Generate the post content
    let postContent = template.template;

    // Replace business name placeholder if provided
    if (businessName) {
      postContent = postContent.replace(/Smart Invoice/g, businessName);
    }

    // Add motivational message based on milestone
    const motivationalMessages = [
      "Keep pushing forward! 💪",
      "Every invoice brings you closer to your goals! 🎯",
      "Your hard work is paying off! 🌟",
      "Success is built one invoice at a time! 🏗️",
      "You're building something amazing! 🚀",
      "Your business is growing stronger every day! 📈",
      "Stay focused and keep creating! 🎯",
      "You're on the path to greatness! 🌟",
      "One invoice at a time, you're building an empire! 👑",
      "Your dedication is inspiring! 💫"
    ];

    const randomMotivation = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    const fullPost = `${postContent}\n\n${randomMotivation}`;

    return NextResponse.json({
      post: fullPost,
      hashtags: template.hashtags,
      milestone,
      businessName: businessName || 'Smart Invoice'
    });

  } catch (error) {
    console.error('Error generating social post:', error);
    return NextResponse.json({ error: 'Failed to generate social post' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Mock data for testing - simulate invoice count
    const mockInvoiceCount = Math.floor(Math.random() * 50) + 1; // Random count between 1-50

    // Find next milestone
    const nextMilestone = SOCIAL_POST_TEMPLATES.find(t => t.milestone > mockInvoiceCount)?.milestone || null;

    return NextResponse.json({
      currentCount: mockInvoiceCount,
      nextMilestone,
      availableMilestones: SOCIAL_POST_TEMPLATES.map(t => t.milestone)
    });

  } catch (error) {
    console.error('Error fetching milestone data:', error);
    return NextResponse.json({ error: 'Failed to fetch milestone data' }, { status: 500 });
  }
}