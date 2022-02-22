# Typesense Server User Interface

A user interface for the Typesense Server, run in the browser

## Running the interface

a) add "enable-cors = true" to your Typesense Server in /etc/typesense/typesense-server.ini

b) add your Typesense Server API key and your Typesense Nodes to to env in /js/typesense-api.js

c) open typesense-ui.html

You should now see your collections and documents.

## CRUD

### Reading and filtering docs

Documents are displayed unfiltered on initial load. Hover over the table header and enter one or several filters, then click search or press enter to filter. Reset the filters with the close button or esc key.

**Pagination**

Hover of the collection title to get the page buttons displayed. Click up or down to flick through the paginated results.

You can set the pagination in env in /js/typesense-api.js. Max 250.

### Writing new docs

Hover over the table header and enter one or several entries, then click upload. Reset the entries with the close button or esc key.

### Updating fields of a doc

Click the entry in the cell, make the change, then click somewhere else or press enter to commit the change.

### Deleting docs

Hover over the first column to get the delete button displayed for the row. Click it to get the confirmation button displayed. Click the confirmation button to irreversibly delete the doc from the collection.

### Scroll

When the contents of a cell overflow, you can scroll the cell left and right and the viewer will continuously scroll the content left in order to be able to read the full text.
