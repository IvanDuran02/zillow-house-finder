import * as cheerio from "cheerio";
import axios from "axios";

const locations = [
  "miami",
  "pensacola",
  "dallas",
  "austin",
  "houston",
  "san antonio",
  "palm-beach",
  "las-vegas",
  "las-angeles",
  "san-fran",
  "toronto",
  "brampton",
  "montreal",
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
  const url = `https://www.zillow.com/homes/${location}`;
  const response = await axios(url); // fetch the page
  const body = await response.data; // get the body of the page (source HTML)
  const $ = cheerio.load(body); // load the HTML into cheerio
  const data: any = [];
  const formatted: any = [];
  const links: any = [];
  // const images: any = [];

  console.log(body);

  $(".list-card").each((i, element) => {
    const address = $(element).find(".list-card-addr").text();
    const price = $(element).find(".list-card-price").text();
    const zpid = $(element).attr("id");

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

  data.forEach(async (property: any, index: number) => {
    const fetchImageUrl = await fetch(property.link);
    const imgBody = await fetchImageUrl.text(); // get the body of the page (source HTML)
    const $$ = cheerio.load(imgBody); // load the HTML into cheerio
    $$(".media-column-container")
      .find("img")
      .each((i, element) => {
        console.log($(element).attr("src"));
      });
  });

  // console.log(data);
}

for (let i = 0; i < locations.length; i++) {
  getProperty(locations[i]);
}
