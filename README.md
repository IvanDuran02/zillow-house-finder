# zillow-house-finder

This is a WebScraper using Cheerio(npm package) that grabs housing information off of zillow.com for use in one of my other projects, estate guesser.

In the code I put an array of cities so that the scraper can grab newly listed houses from all those cities. The information it grabs currently is just house price, address, and 1-9 images.

The problems I ran into making this code have to do with zillows infinite scrolling, my scraper will at maximum grab 9 images because that is the default amount of images rendered in until user scrolls down. A solution for this would be to find where zillow makes its own requests for the property data, checking the network tab to see requests made by zillow.

Another problem is that zillow constantly changes css class names and encrypts class names making it difficult to grab certain information. currently if you want to use this code for yourself it WILL NOT WORK. you would need to update the code with the new class names.

After scraping data for about 200 houses I stored them in a sqlite database using prisma.io as my ORM. (the sqlite file is included in the code)
