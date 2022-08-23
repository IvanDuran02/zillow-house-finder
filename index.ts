import * as cheerio from "cheerio";

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

async function getProperty() {
  const response = await fetch("https://www.zillow.com/homes/palm-beach"); // fetch the page
  const body = await response.text(); // get the body of the page (source HTML)
  const $ = cheerio.load(body); // load the HTML into cheerio
  const data: any = [];
  const formatted: any = [];
  const links: any = [];

  $(".list-card").each((i, element) => {
    const address = $(element).find(".list-card-addr").text();
    const price = $(element).find(".list-card-price").text();
    // const image = $(element).find("img").attr("src"); // wrong image link
    const zpid = $(element).attr("id");

    data.push({ address, price, zpid });
  });
  data.pop(); // remove the last element of the array, for some reason last element is empty
  for (let i = 0; i < data.length; i++) {
    if (data[i].address.startsWith("(undisclosed Address),")) {
      formatted.push(formatAddr(data, i)); // format the undisclosed address
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

  data.forEach((item: any, index: number) => (item.link = links[index]));
  console.log(data);

  // const formattedData3 = formattedData2.replace(",", ""); // remove all whitespace
  // console.log(formattedData3);
}

getProperty();

// const link = $(".list-card").attr("id"); -- gets the zpid so that we can go to property page and grab all the images
