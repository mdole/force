export const computeLandingPages = appUrl => {
  const urls = [
    { loc: appUrl, priority: 1 },
    { loc: appUrl + "/about", priority: 1 },
    { loc: appUrl + "/all-cities" },
    { loc: appUrl + "/art-fairs" },
    { loc: appUrl + "/articles" },
    { loc: appUrl + "/artists", priority: 1 },
    { loc: appUrl + "/artsy-education" },
    { loc: appUrl + "/auction-info" },
    { loc: appUrl + "/auction-partnerships" },
    { loc: appUrl + "/auctions" },
    { loc: appUrl + "/buying-with-artsy" },
    { loc: appUrl + "/categories" },
    { loc: appUrl + "/collect", priority: 1 },
    { loc: appUrl + "/conditions-of-sale" },
    { loc: appUrl + "/consign" },
    { loc: appUrl + "/contact" },
    { loc: appUrl + "/institution-partnerships" },
    { loc: appUrl + "/institutions" },
    { loc: appUrl + "/jobs" },
    { loc: appUrl + "/login" },
    { loc: appUrl + "/press/in-the-media" },
    { loc: appUrl + "/press/press-releases" },
    { loc: appUrl + "/privacy" },
    { loc: appUrl + "/security" },
    { loc: appUrl + "/shows", priority: 1 },
    { loc: appUrl + "/signup" },
    { loc: appUrl + "/terms" },
    { loc: appUrl + "/viewing-rooms" },
  ]

  return urls
}
