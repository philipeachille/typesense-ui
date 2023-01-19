const TypesenseAPI = ( () => {

  /**
   * To run the UI with your own data:
   *  a) add "enable-cors = true" to your server in /etc/typesense/typesense-server.ini
   *  b) set your env below
   *  c) set "USE_DEMO" in env to false or remove anything demo-related entirely
   */

  const env = {
    TS_SERVER_KEY: 'your key here',
    TS_NODES: [{
      host: 'your ip here',
      port: '8108',
      protocol: 'http',
    }],
    PAGE_LENGTH: 20,
    USE_DEMO: true,
  };


const client = !env.USE_DEMO
  ? new Typesense.Client( {
    nodes: env.TS_NODES,
    apiKey: env.TS_SERVER_KEY,
    connectionTimeoutSeconds: 2,
  } )
  : { /* MOCKS A DEMO */
    demoDocuments: {
      cars: [{ document: { id: 1, manufacturer: 'BMW' } }, { document: { id: 2, manufacturer: 'Audi' } }, { document: { id: 78, manufacturer: 'Volkswagen', wheels: 'need service' } }],
      cakes: [{ document: { id: 1, flavor: 'chocolate', topping: 'vanilla ice cream' } }, { document: { id: 2, flavor: 'strawberry', topping: 'no topping' } }],
      users: [],
    },
    collections: ( collName ) => ( {
      retrieve: () =>

        /* mock returned collections */
        [
          { name: 'cars', num_documents: 3, fields: [{ name: 'manufacturer' }, { name: 'color' }, { name: 'speed' }, { name: 'wheels' }] },
          { name: 'cakes', num_documents: 2, fields: [{ name: 'flavor' }, { name: 'topping' }] },
          { name: 'users', num_documents: 0, fields: [{ name: 'First Name' }, { name: 'Last Name' }, { name: 'Full Address' }] },
        ],
      documents: () => ( {
        search: async ( queryData ) =>

          /* mock returned queries */
          queryData.collName == 'cars' && { found: client.demoDocuments.cars.length, page: 1, hits: client.demoDocuments.cars }
          || queryData.collName == 'cakes' && { found: client.demoDocuments.cakes.length, page: 1, hits: client.demoDocuments.cakes }
          || queryData.collName == 'users' && { found: client.demoDocuments.users.length, page: 1, hits: client.demoDocuments.users },
        create: async ( data ) => {

          /* mock document creation */
          client.demoDocuments[collName].push( { document: Object.assign( data, { id: client.demoDocuments[collName].length + 1 } ) } );
          return {
            httpStatus: null,
          };
        },
        delete: async ( queryData ) =>

          /* mock document deletion */
          ( {
            httpStatus: null,
          } ),
        update: async ( queryData ) =>

          /* mock document update */
          ( {
            httpStatus: null,
          } )
        ,
      } ),
    } ),
  };

  async function getColls() {
    return client.collections().retrieve();
  }

  async function getQuery( queryData ) {
    return client.collections( queryData.collName )
      .documents()
      .search( queryData )
      .catch( err => {
        console.log( err );
        return err;
      } );
  }

  async function setDoc( queryData ) {
    return client.collections( queryData.collName )
      .documents()
      .create( queryData.data )
      .catch( err => {
        console.log( err );
        return err;
      } );
  }

  async function deleteDoc( queryData ) {
    return client.collections( queryData.collName )
      .documents( queryData.which )
      .delete()
      .catch( err => {
        console.log( err );
        return err;
      } );
  }

  async function updateDoc( data ) {
    return client.collections( data.collName )
      .documents( data.which )
      .update( data.data )
      .catch( err => {
        console.log( err );
        return err;
      } );
  }

  async function presenter( queryData ) {

    /**
    * block further execution of down button until this query is executed
    * (prevent race condition)
    */
    CollState[queryData.collName].pageNumberReverse == 1;

    /** mixin page info */
    Object.assign( queryData, {
      per_page: CollState[queryData.collName].pageLength || env.PAGE_LENGTH,
      page: queryData.pageNumber || CollState[queryData.collName].pageNumber,
    } );

    /** query */
    const res = await getQuery( queryData );

    /** set response into state */
    Object.assign( CollState[queryData.collName], {
      found: res.found,
      pageNumber: res.page,
      data: res.hits.map( item => item.document ),
    } );

    setHitsPageDetails( queryData.collName );

    return queryData.collName;
  }

  function view( collName ) {
    const coll = CollState[collName];

    setHitsDetails( collName );

    if ( coll.data.length ) {

      /** populate hits */
      V.sN( '#hits-table-of__' + collName, '' );
      V.sN( '#hits-table-of__' + collName,
        Components.hitsTable( coll ),
      );

      return {
        success: true,
        found: coll.found,
      };
    }
    else {
      return { success: false };
    }
  }

  function setHitsPageDetails( collName ) {
    const c = CollState[collName];
    const pL = c.pageLength || env.PAGE_LENGTH;

    /* pagesTotal */
    const pT = Math.ceil( c.found / pL );

    /* pageNumberReverse */
    const pNRev = pT - c.pageNumber + 1;

    const offset = c.found % pL ? pL - c.found % pL : 0;

    const rangeEnd = pL * pNRev - offset;
    let rangeStart = rangeEnd - pL + 1;

    rangeStart <= 0 ? rangeStart = 1 : null;

    Object.assign( CollState[collName], {
      rangeStart: rangeStart,
      rangeEnd: rangeEnd,
      pagesTotal: pT,
      pageNumberReverse: pNRev,
    } );
  }

  function setHitsDetails( collName ) {

    const coll = CollState[collName];

    V.sN( '#viewer-of__' + collName, '' );

    if ( coll.data.length ) {
      V.sN( '#found__' + collName,
        coll.found == coll.foundTotal
          ? 'All'
          : coll.found + ' of ' + coll.foundTotal,
      );
      V.sN( '#page-number__' + collName, coll.pageNumberReverse + ' of ' + coll.pagesTotal );
      V.sN( '#page-range__' + collName, coll.rangeStart + ' - ' + coll.rangeEnd );
    }
    else {
      V.sN( '#viewer-of__' + collName, 'NOTHING FOUND' );
    }
  }

  /** count-forwards version */
  // function setHitsRange( collName ) {
  //   const c = CollState[collName];
  //   const pL = c.pageLength || env.PAGE_LENGTH;
  //
  //   const rangeStart = pL * ( c.pageNumber - 1 ) + 1;
  //   let rangeEnd = pL * c.pageNumber;
  //
  //   rangeEnd > c.foundTotal
  //     ? rangeEnd = rangeStart - 1 + c.foundTotal % pL
  //     : null;
  //
  //   Object.assign( CollState[collName], {
  //     rangeStart: rangeStart,
  //     rangeEnd: rangeEnd,
  //   } );
  // }

  function draw( queryData ) {
    return presenter( queryData )
      .then( collName => view( collName ) );
  }

  return {
    getColls: getColls,
    setDoc: setDoc,
    deleteDoc: deleteDoc,
    updateDoc: updateDoc,
    draw: draw,
  };
} )();
