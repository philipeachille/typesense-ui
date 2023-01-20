# Typesense Server User Interface

A user interface for the Typesense Server, run in the browser

<img width="803" alt="Screenshot 2023-01-19 at 12 28 00" src="https://user-images.githubusercontent.com/20671922/213431167-5e71148e-90a8-4e79-8db5-6764e8002701.png">

## Running the interface with demo data

a) clone or download this repo

b) open typesense-ui.html

You should now see three collections and some demo documents. Note that the demo does not present all features and may introduce bugs that don't occur when connecting your own instance. So it's recommended to connect to your own server.

## Running the interface with your own data

a) add "enable-cors = true" to your Typesense Server in /etc/typesense/typesense-server.ini

b) clone or download this repo

c) add your Typesense Server API key and your Typesense Nodes to env in /js/typesense-api.js

d) set "USE_DEMO" in env to false or remove anything demo-related entirely

e) open typesense-ui.html

You should now see your collections and your documents.

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

## Other Functionality

### Scroll

When the contents of a cell overflow, you can scroll the cell left and right and the viewer will continuously scroll the content left in order to be able to read the full text.

### Dark and Light Mode

The UI defaults to dark mode. To change to light mode, load style-light.css in typesense-ui.html
