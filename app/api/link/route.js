import { Pinecone } from "@pinecone-database/pinecone";
import axios from "axios";
import * as cheerio from "cheerio";
import { NextResponse } from "next/server";

const MODEL = "intfloat/multilingual-e5-large";
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});
const index = pc.index("rag").namespace("ns1");

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const link = searchParams.get("url"); // Extract the URL query parameter

  if (!link) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  try {
    const response = await axios.get(link); // Fetch the HTML from the link
    const html = response.data;
    // Load the HTML into Cheerio
    const $ = cheerio.load(html);

    // Parse the professor's name and department
    const professorName = $('div[class*="NameTitle__Name"]').text().trim();
    const department = $('div[class*="NameTitle__Title"]').text().trim();
    const reviews = [];

    // Iterate over each review
    $(".Rating__RatingBody-sc-1rhvpxz-0").each((index, element) => {
      const reviewElement = $(element);

      const className = reviewElement
        .find(".RatingHeader__StyledClass-sc-1dlkqw1-3")
        .first()
        .text()
        .trim();
      const quality = parseFloat(
        reviewElement
          .find(".CardNumRating__CardNumRatingNumber-sc-17t4b9u-2")
          .first()
          .text()
          .trim()
      );
      const difficulty = parseFloat(
        reviewElement
          .find(".CardNumRating__CardNumRatingNumber-sc-17t4b9u-2")
          .last()
          .text()
          .trim()
      );
      const reviewText = reviewElement
        .find(".Comments__StyledComments-dzzyvm-0")
        .text()
        .trim();
      const timestamp = reviewElement
        .find(".TimeStamp__StyledTimeStamp-sc-9q2r30-0")
        .first()
        .text()
        .trim();

      reviews.push({
        professor: professorName,
        department: department,
        class: className,
        quality: quality,
        difficulty: difficulty,
        review: reviewText,
        timestamp: timestamp,
      });
    });

    // Return the parsed data as JSON
    return NextResponse.json({ reviews });
  } catch (error) {
    // Return the axios error status code if it exists, otherwise return 500
    const statusCode = error.response ? error.response.status : 500;
    const errorMessage = error.response
      ? error.response.data
      : "Failed to fetch the URL";

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

export async function POST(req) {
  return NextResponse.json();
}
