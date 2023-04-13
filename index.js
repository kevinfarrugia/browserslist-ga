#!/usr/bin/env node

const fs = require("fs");
const inquirer = require("inquirer");
const googleAuth = require("./src/google-auth");
const { getAccounts, getProperties, getData } = require("./src/google-analytics");
const { parse } = require("./src/caniuse-parser");

inquirer.registerPrompt("datetime", require("inquirer-datepicker-prompt"));

const outputFilename = "browserslist-stats.json";

googleAuth(oauth2Client => {
  let selectedProfile;

  getAccounts(oauth2Client)
    .then(accounts => {
      if (accounts.length === 0) {
        throw new Error("No Google Analytics accounts.");
      }

      return accounts;
    })
    .then(accounts =>
      inquirer.prompt([
        {
          type: "list",
          name: "account",
          message: "Please select an account:",
          choices: accounts.map(account => ({
            value: account,
            name: `${account.displayName} (#${account.name.slice(
              account.name.lastIndexOf("/") + 1
            )})`,
          })),
        },
      ])
    )
    .then(({ account }) => getProperties(oauth2Client, account.name))
    .then(properties =>
      inquirer.prompt([
        {
          type: "list",
          name: "property",
          message: "Please select a property:",
          choices: properties.map(property => ({
            value: property,
            name: `${property.displayName} (#${property.name.slice(
              property.name.lastIndexOf("/") + 1
            )}})`,
          })),
        },
      ])
    )
    .then(({ property }) => {
      const defaultStartDate = new Date();
      const defaultEndDate = new Date();

      selectedProperty = property;

      // End date defaults to today, start date defaults to 90 days ago
      defaultStartDate.setDate(defaultEndDate.getDate() - 90);

      return inquirer.prompt([
        {
          type: "datetime",
          name: "startDate",
          message: 'Specify a start date (format is "YYYY-MM-DD", defaults to 90 days ago):',
          format: ["yyyy", "-", "mm", "-", "dd"],
          initial: defaultStartDate,
        },
        {
          type: "datetime",
          name: "endDate",
          message: 'Specify an end date (format is "YYYY-MM-DD", defaults to today):',
          format: ["yyyy", "-", "mm", "-", "dd"],
          initial: defaultEndDate,
        },
      ]);
    })
    .then(({ startDate, endDate }) =>
      getData(oauth2Client, selectedProperty.name, startDate, endDate)
    )
    .then(parse)
    .then(stats => {
      fs.writeFileSync(outputFilename, JSON.stringify(stats, null, 2));
      console.log(`Success! Stats saved to '${outputFilename}'`);
      process.exit();
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
});
