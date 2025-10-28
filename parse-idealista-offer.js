// URL: https://www.idealista.com/en/inmueble/109353808/?utm_medium=email&utm_campaign=express_newAd_rent_professional&
// utm_campaigntype=retention&utm_project=adNotification&utm_source=alerts-id&utm_date_send=2025-09-22T110719&
// utm_link=propertyNewPhoto&utm_recipient_id=OMBwrrUL5DtD6OHgmuEZn0ELCSQ03jnI6tHdoiTKcE0%3D
// TODO: test with https://github.com/jsdom/jsdom example:
//  https://dev.to/thawkin3/how-to-unit-test-html-and-vanilla-javascript-without-a-ui-framework-4io

function offerToWiki(offer) {
    let adv = offer.advertiser;
    let tel = (null === adv.telephone) ? "" : `- tel. [${adv.telephone.display}](${adv.telephone.href})`
    let advWiki = adv.url ? `[${adv.name}](${adv.url})` : `\`${adv.name}\``
    advWiki = `
- ${adv.type}: ${advWiki}
${tel}
`.trim();

    let locationMap = offer.locationUrl ? `  [View map](${offer.locationUrl})` : '';
    let wiki = `
### ${offer.dateAdded} ${offer.shortAdDesc}: ${offer.priceEurMonthly} €/month
- ![|200](${offer.imageUrl})
- Listing reference: \`${offer.reference}\`
${advWiki}
- [${offer.title}](${offer.canonicalUrl})
- ${offer.location}${locationMap}
- ${offer.description}
`.trim();
    return wiki;
}

function waitForElement(selector, callback, action = null) {
    let counter = 20;
    const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element || 0 === counter--) {
            clearInterval(interval);
            callback(element);
        } else {
            console.log(`Czekam na element: ${selector}, zostało ${counter} prób.`);
            if (null !== action) {
                console.log("Ponawiam akcję");
                action();
            }
        }
    }, 100); // Check every 100ms
}

function parseDateAdded() {
    let utmDateSend = URL.parse(document.querySelector(
        "link[rel=\"alternate\"][hreflang=\"x-default\"]").href).searchParams.get("utm_date_send");
    let rx = /^(20[0-9]{2}-[0-9]{2}-[0-9]{2})T[0-9]{6}/g;
    let dateAdded = rx.exec(utmDateSend)[1];
    return dateAdded;
}

function parseLocationUrl() {
    let noAddress = document.querySelector("#static-map-container > div.no-show-address-feedback");
    if (null != noAddress) {
        return null;
    }
    // document.querySelector("#sMap").src
    // src="https://maps.googleapis.com/maps/api/staticmap?
    // size=742x330&
    // center=37.88488790%2C-0.75529410&
    // ...
    // https://www.google.com/maps/place/37.88488790%2C-0.75529410
    let mapSrc = document.querySelector("#sMap").src;
    let mapCenter = URL.parse(mapSrc).searchParams.get("center");
    return `https://www.google.com/maps/place/${encodeURIComponent(mapCenter)}`;
}

function parseDescription() {
    let nodes = document.querySelectorAll(
        "section.detail-info > section.detail-content-wrapper > div:is(.info-features,.detail-info-tags) > " +
        "span");
    let description = Array.prototype.map.call(nodes, node => node.textContent.trim()).join(", ");
    return description;
}

function parseAdvertiser() {
    let cdc = document.querySelector("div.contact-data-container");
    let type = cdc.querySelector("div.professional-name > div.name").textContent.trim();
    let name = cdc.querySelector("div.professional-name > span").textContent.trim();
    let url = document.querySelector(
        "div.about-container > div.advertiser-name-container > a.about-advertiser-name")
        ?.href;
    let tel = document.querySelector("#contact-phones-container > a._mobilePhone");
    let telDetails = (null === tel) ? null : {
        "href": tel.href,
        "display": tel.textContent.trim(),
    }
    return {
        "type": type,
        "name": name,
        "url": url,
        "telephone": telDetails
    }
}

function parseIdealistaOffer() {
    let pageUrl = document.URL;
    let title = document.title;
    let shortAdDesc = document.querySelector(
        "section.detail-info > section.detail-content-wrapper > div.main-info__title > h1 > span")
        .innerHTML;
    let canonicalUrl = document.querySelector("head > meta[property=\"og:url\"]")
        .content;
    let imageUrl = document.querySelector(
        "div.main-image > div.main-image_first > picture > source[type=\"image/jpeg\"]")
        .srcset;
    let reference = document.querySelector("div.ad-reference-container > p.txt-ref")
        .innerHTML.trim();
    let advertiser = parseAdvertiser();
    let priceEurMonthly = document.querySelector(
        "section.detail-info > section.detail-content-wrapper > div.info-data > span.info-data-price > span")
        .innerHTML;
    let dateAdded = parseDateAdded();
    let location = document.querySelector(
        "section.detail-info > section.detail-content-wrapper > div.main-info__title > " +
        "span.main-info__title-block > span.main-info__title-minor")
        .innerHTML;
    let locationUrl = parseLocationUrl();
    let description = parseDescription();

    let offer = {
        "pageUrl": pageUrl,
        "title": title,
        "shortAdDesc": shortAdDesc,
        "canonicalUrl": canonicalUrl,
        "imageUrl": imageUrl,
        "reference": reference,
        "advertiser": advertiser,
        "priceEurMonthly": priceEurMonthly,
        "dateAdded": dateAdded,
        "location": location,
        "locationUrl": locationUrl,
        "description": description,
    }

    console.log("Idealista offer", offer);
    console.log(offerToWiki(offer));
    return offerToWiki(offer);
}

function ensureMapVisible() {
    console.log("Scrolluję w dół żeby zobaczyć mapę");
    window.scrollTo(0, document.body.scrollHeight);
    waitForElement("#sMap", (element) => {
        console.log('Map rendered:', element);
        window.scrollTo(0, 0);
    }, () => {
        window.scrollTo(0, document.body.scrollHeight);
    })
}

function addCopyToClipboardButton() {
    let parent = document.getElementById('side-content');
    let button = document.createElement('button');
    button.innerHTML = 'Copy to clipboard';
    parent.insertBefore(button, parent.firstChild);
    function onclick() {
        let wiki = parseIdealistaOffer();
        navigator.clipboard.writeText(wiki);
        button.style.backgroundColor = "green";
    }
    button.addEventListener('click', onclick);
}

function fetchPhoneNumber() {
    let button = document.querySelector(
        "#contact-phones-container > a.see-phones-btn.icon-phone-outline.hidden-contact-phones_link > " +
        "span.hidden-contact-phones_text");
    if (null !== button) {
        button.click();
        waitForElement('#contact-phones-container > a._mobilePhone', (element) => {
            console.log('Telephone number rendered:', element);
            ensureMapVisible();
        });
    } else {
        ensureMapVisible();
    }
    addCopyToClipboardButton();
}



window.addEventListener('load', fetchPhoneNumber);
