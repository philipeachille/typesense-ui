
const CollState = {};

const App = ( ()=> {

  async function presenter() {
    CollState.colls = await TypesenseAPI.getColls();
    CollState.colls.sort( ( a, b ) => b.num_documents - a.num_documents );
    CollState.colls.forEach( coll => {
      coll.fields.unshift( { name: 'id' } );
      CollState[coll.name] = {
        pageNumber: 1,
        fields: coll.fields,
        foundTotal: coll.num_documents,
      };
    } );
  }

  function view() {

    CollState.colls.forEach( coll => {
      V.getNode( 'app' ).append( V.castNode( {
        c: 'collection',
        a: {
          collName: coll.name,
        },
        h: [
          Components.collHeader( coll ),
          Components.detailView( coll ),
          Components.searchTable( coll ),
          Components.hitsTableWrapper( coll ),
        ],
      } ) );

      TypesenseAPI.draw( {
        collName: coll.name,
        q: '*',
      } );

    } );

  }

  presenter().then( () => view() );
} )();

/** Display console output in UI during dev */
const logCopy = window.console.log;

Object.assign( window.console, {
  log: handleConsoleMessage,
  error: handleConsoleMessage,
  html: handleConsoleMessage,
} );

function handleConsoleMessage( msg, data ) {
  data ? logCopy( msg, data ) : logCopy( msg );
  document.querySelector( 'logs' ).innerHTML
  += '<br/><br/>'
  + ( typeof msg == 'string' ? msg : JSON.stringify( msg ) )
  + '<br/>'
  + ( typeof data == 'string' ? data : data ? JSON.stringify( data ) : '' );
}
