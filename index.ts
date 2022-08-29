import * as cheerio from "cheerio";

import { PrismaClient } from "@prisma/client";
import { parse } from "path";

const prisma = new PrismaClient();

const locations = [
  "ottawa",
  "vancouver",
  "detroit",
  "compton",
  "seattle",
  "chicago",
  "washington",
  "new-york",
  "boston",
  "new-orleans",
  "philadelphia",
  "phoenix",
  "san-diego",
  "oakland",
  "san-jose",
  "salt-lake-city",
  "tampa",
  "toronto",
  "los-angeles",
  "houston",
  "miami",
  "mexico-city",
  "minneapolis",
  "palm-beach",
];

const formatAddr = (data: any, i: number) => {
  // cut the undisclosed address from the address so that we can construct the image url
  const undisclosedAddress = data[i].address.replace(
    /\(undisclosed Address\),/g,
    ""
  );
  const formatUndisclosedAddress = undisclosedAddress.replace(" ", ""); // removes first space
  const formatUndisclosedAddress2 = formatUndisclosedAddress.replace(
    /\s/g,
    "-"
  ); // remove all whitespace
  const formatUndisclosedAddress3 = formatUndisclosedAddress2.replace(
    /\,/g,
    ""
  ); // remove all whitespace
  return formatUndisclosedAddress3;
};

async function getProperty(location: string) {
  console.log("Script Starting...");

  const url = `https://www.zillow.com/homes/${location}`;
  const response = await fetch(url); // fetch the page
  const body = await response.text(); // get the body of the page (source HTML)
  const $ = cheerio.load(body); // load the HTML into cheerio
  const data: any = [];
  const formatted: any = [];
  const links: any = [];

  $(".list-card").each((i, element) => {
    const address = $(element).find(".list-card-addr").text();
    const priceTemp = $(element).find(".list-card-price").text();
    const zpid = $(element).attr("id");
    // turns price into a number
    const price1 = priceTemp.replace(/\$/g, "");
    const price2 = price1.replace(/\,/g, "");
    const price3 = price2.replace(/\C/g, "");
    const price = parseInt(price3);
    data.push({ address, price, zpid });
  });
  data.pop(); // remove the last element of the array, for some reason last element is empty

  for (let i = 0; i < data.length; i++) {
    if (data[i].address.startsWith("(undisclosed Address),")) {
      formatted.push(await formatAddr(data, i)); // format the undisclosed address
    } else {
      const formattedData = data[i].address.replace(/\s/g, "-"); // remove all whitespace

      const formattedData2 = formattedData.replace(/\,/g, ""); // remove all whitespace

      formatted.push(formattedData2);
    }
    const zpidID = data[i].zpid.replace("zpid_", "");
    links.push(
      `https://www.zillow.com/homedetails/${formatted[i]}/${zpidID}_zpid`
    );
  }

  data.forEach(
    (property: any, index: number) => (property.link = links[index])
  ); // merges the links into the data array

  async function main() {
    // ... you will write your Prisma Client queries here
    data.forEach(async (property: any, index: number) => {
      const images: any = [];
      const fetchImageUrl = await fetch(property.link);
      const imgBody = await fetchImageUrl.text(); // get the body of the page (source HTML)
      const $$ = cheerio.load(imgBody); // load the HTML into cheerio
      $$(".media-column-container")
        .find("img")
        .each((i, element) => {
          return images.push(String($(element).attr("src")));
        });
      try {
        await prisma.property
          .create({
            data: {
              address: property.address,
              price: property.price,
              link: property.link,
              zpid: property.zpid,
            },
          })
          .then(() => {
            console.log(`Property ${index} created`);
          });
        await prisma.property
          .findMany({
            where: {
              zpid: property.zpid,
            },
          })
          .then(async (property: any) => {
            console.log(images);
            console.log(property[0].id);
            for (let i = 0; i < images.length; i++) {
              try {
                await prisma.images.create({
                  data: {
                    imageURL: images[i],
                    propertyID: property[0].id,
                  },
                });
              } catch (error) {
                console.log(error);
              }
            }
          });
      } catch (error) {
        console.log(error);
        // properties have to be unique
      }
    });
  }

  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });

  return data;
}

// const testFunction = async () => {
//   try {
//     const temp = await prisma.property.findMany({});
//     console.log(temp);
//   } catch (error) {
//     console.log(error);
//   }
// };

// testFunction();

for (let i = 0; i < locations.length; i++) {
  getProperty(locations[i]);
}

// sample data

const sampleData = [
  {
    address: "14944 SW 132nd Ave, Miami, FL 33186",
    price: 399444,
    link: "https://www.zillow.com/homedetails/495-Brickell-Ave-APT-2511-Miami-FL-33131/92440680_zpid",
    zpid: "zpid_44331199",
  },
  {
    address: "801 NW 17th Ct, Miami, FL 33125",
    price: 399444,
    link: "https://www.zillow.com/homedetails/2200-SW-24th-Ter-Miami-FL-33145/43855133_zpid",
    zpid: "zpid_43824581",
  },
  {
    address: "1849 NW 35th St, Miami, FL 33142",
    price: 399444,
    link: "https://www.zillow.com/homedetails/750-NE-64th-St-APT-B201-Miami-FL-33138/64769520_zpid",
    zpid: "zpid_2070160665",
  },
];
