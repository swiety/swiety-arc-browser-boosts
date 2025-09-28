function waitForElement(selector, callback) {
    const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
            clearInterval(interval);
            callback(element);
        } else {
            console.log("Czekan na element: ", selector);
        }
    }, 100); // Check every 100ms
}

function parseDateAdded() {
    let utmDateSend = URL.parse(document.querySelector("link[rel=\"alternate\"][hreflang=\"x-default\"]").href).searchParams.get("utm_date_send");
    let rx = /^(20[0-9]{2}-[0-9]{2}-[0-9]{2})T[0-9]{6}/g;
    let dateAdded = rx.exec(utmDateSend)[1];
    return dateAdded;
}

function parseLocationUrl() {
    let noAddress = document.querySelector("#static-map-container > div.no-show-address-feedback");
    if (null != noAddress) {
        return null;
    }
    return "https://TODO:LOCATION-PARSING/";
}

function parseDescription() {
    let nodes = document.querySelectorAll("section.detail-info > section.detail-content-wrapper > div:is(.info-features,.detail-info-tags) > span");
    let description = Array.prototype.map.call(nodes, node => node.textContent.trim()).join(", ");
    return description;
}

function parseAdvertiser() {
    let cdc = document.querySelector("div.contact-data-container");
    let type = cdc.querySelector("div.professional-name > div.name").textContent.trim();
    let name = cdc.querySelector("div.professional-name > span").textContent.trim();
    let url = document.querySelector("div.about-container > div.advertiser-name-container > a.about-advertiser-name").href;
    let tel = document.querySelector("#contact-phones-container > a._mobilePhone");
    let telHref = tel.href;
    let telDisplay = tel.textContent.trim();
    return {
        "type": type,
        "name": name,
        "url": url,
        "telephone": {
            "href": telHref,
            "display": telDisplay,
        }
    }
}

function parseIdealistaOffer() {
    let pageUrl = document.URL;
    let title = document.title;
    let shortAdDesc = document.querySelector("section.detail-info > section.detail-content-wrapper > div.main-info__title > h1 > span").innerHTML;
    let canonicalUrl = document.querySelector("head > meta[property=\"og:url\"]").content;
    let image_url = document.querySelector("div.main-image > div.main-image_first > picture > source[type=\"image/jpeg\"]").srcset;
    let reference = document.querySelector("div.ad-reference-container > p.txt-ref").innerHTML.trim();
    let advertiser = parseAdvertiser();
    let price_eur_monthly = parseInt(document.querySelector("section.detail-info > section.detail-content-wrapper > div.info-data > span.info-data-price > span").innerHTML);
    let dateAdded = parseDateAdded();
    let location = document.querySelector("section.detail-info > section.detail-content-wrapper > div.main-info__title > span.main-info__title-block > span.main-info__title-minor").innerHTML;
    let locationUrl = parseLocationUrl();
    let description = parseDescription();

    let offer = {
        "pageUrl": pageUrl,
        "title": title,
        "shortAdDesc": shortAdDesc,
        "canonicalUrl": canonicalUrl,
        "image_url": image_url,
        "reference": reference,
        "advertiser": advertiser,
        "price_eur_monthly": price_eur_monthly,
        "dateAdded": dateAdded,
        "location": location,
        "locationUrl": locationUrl,
        "description": description,
    }

    console.log("Idealista offer", offer);
}

function fetchPhoneNumber() {
    let button = document.querySelector("#contact-phones-container > a.see-phones-btn.icon-phone-outline.hidden-contact-phones_link > span.hidden-contact-phones_text");
    button.click();
    waitForElement('#contact-phones-container > a._mobilePhone', (element) => {
        console.log('Element exists:', element);
        parseIdealistaOffer();
    });
}

window.addEventListener('load', fetchPhoneNumber);
