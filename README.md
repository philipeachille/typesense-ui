# Typesense Server User Interface

A user interface for the Typesense Server, run in the browser

## Running the interface

a) add "enable-cors = true" to your Typesense Server in /etc/typesense/typesense-server.ini

b) add your Typesense Server API key and your Typesense Nodes to to env in /js/typesense-api.js

c) open typesense-ui.html

You should now see your collections and documents.

## CRUD

### Reading and filtering docs

Documents are displayed unfiltered on initial load. Hover over the table header and enter one or several filters, then click search or press enter to filter. Reset the filters with the close button.

**Pagination**

Hover of the collection title to get the page buttons displayed. Click up or down to flick through the paginated results.

You can set the pagination in env in /js/typesense-api.js. Max 250.

### Writing new docs

Hover over the table header and enter one or several entries, then click upload. Reset the entries with the close button.

### Deleting docs

Hover over the first column to get the delete button displayed for the row. Click it to get the confirmation button displayed. Click the confirmation button to irreversibly delete the doc from the collection.
