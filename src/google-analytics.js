const { google } = require("googleapis");

// API Documentation: https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1
const analyticsAdmin = google.analyticsadmin("v1");
const analyticsData = google.analyticsdata("v1");

const getAccounts = auth =>
  new Promise((resolve, reject) => {
    analyticsAdmin.accounts.list({ auth }, (err, response) => {
      if (err) return reject(err);

      const results = response.data;
      const accounts = results.accounts;

      resolve(accounts);
    });
  });

const getProperties = (auth, name) =>
  new Promise((resolve, reject) => {
    analyticsAdmin.properties.list({ auth, filter: `parent: ${name}` }, (err, response) => {
      if (err) return reject(err);

      const results = response.data;
      const webProperties = results.properties;

      resolve(webProperties);
    });
  });

const getData = (auth, property, startDate, endDate) =>
  new Promise((resolve, reject) => {
    const options = {
      dimensions: [
        { name: "operatingSystem" },
        { name: "operatingSystemVersion" },
        { name: "browser" },
        { name: "deviceCategory" },
      ],
      orderBys: [{ dimension: { dimensionName: "browser" } }],
      limit: 5000,
      metrics: [{ name: "screenPageViews" }],
      dateRanges: [
        {
          startDate: startDate.toISOString().slice(0, 10),
          endDate: endDate.toISOString().slice(0, 10),
        },
      ],
    };

    console.log("Getting data...");

    analyticsData.properties.runReport(
      { auth, property, requestBody: options },
      (err, response) => {
        if (err) return reject(err);

        const results = response.data;
        const rows = results.rows;

        resolve(rows);
      }
    );
  });

module.exports = {
  getAccounts,
  getProperties,
  getData,
};
