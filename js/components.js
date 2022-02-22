const Components = ( () => {

  let cellContentBefore;

  document.addEventListener( 'keydown',  handleKeysDown );

  /** Handlers */

  function handleKeysDown( e ) {
    const key = window.event ? e.keyCode : e.which;
    if ( key == 13 ) {
      if( V.getVisibility( '.btn__search' ) ) {
        V.getNode( '.btn__search' ).click();
      }
      else if ( hasFocus() ) {
        e.preventDefault();
        document.activeElement.blur(); // updates doc
      }
    }
    else if ( key == 27 ) {
      if( V.getVisibility( '.btn__close' ) ) {
        V.getNode( '.btn__close' ).click();
        document.activeElement.blur();
      }
      if( V.getVisibility( '.btn-wrapper__delete' ) ) {
        V.setNode( '.btn-wrapper__delete', 'clear' );
      }
      if ( document.activeElement.classList.contains( 'full-span' ) ) {
        document.activeElement.innerText = cellContentBefore;
        document.activeElement.blur();
      }
    }
  }

  function handleQuery( e, isPage ) {

    const inputs = getInputs( e.target );
    const collName = getCollName( e.target );

    let filter = '', addAnd;

    for ( let i = 0; i < inputs.length; i++ ) {
      if ( inputs[i].value ) {
        addAnd ? filter += ' && ' : null;
        filter += getField( inputs[i] ) + ':' + inputs[i].value;
        addAnd = true;
      }
    }

    if (
      !isPage
      && filter === ''
    ) {return}

    TypesenseAPI.draw( {
      collName: collName,
      q: '*',
      filter_by: filter,
      pageNumber: isPage ? CollState[collName].pageNumber : 1,
    } )
      .then( res => {
        if ( res.success ) {
          CollState[collName].isOpenQuery = true;
          // setMessage( collName, 'FOUND ' + res.found );
        }
      } );
  }

  function handleQueryPages( e ) {

    const collName = getCollName( e.target );

    if (
      (
        CollState[collName].pageNumberReverse == 1
        && this == 'down'
      )
      || (
        CollState[collName].pageNumber <= 1
        && this == 'up'
      )
    ) {
      return;
    }

    this == 'down'
      ? CollState[collName].pageNumber += 1 // counts up internally, but 'down' in UI
      : CollState[collName].pageNumber -= 1;

    // CollState[collName].pageNumber < 1
    //   ? CollState[collName].pageNumber = 1
    //   : null;

    handleQuery( e, 'isPage' );
  }

  function handleQueryReset( e ) {

    const collName = getCollName( e.target );

    getInputs( e.target ).forEach( $input => {
      $input.value = '';
    } );

    clearSearchHighlights();

    if ( CollState[collName].isOpenQuery ) {
      TypesenseAPI.draw( {
        collName: collName,
        q: '*',
      } )
        .then( res => {
          if ( res.success ) {
            CollState[collName].isOpenQuery = false;
          }
        } );
    }
  }

  function handleSetDoc( e ) {
    const inputs = getInputs( e.target );
    const collName = getCollName( e.target );

    const data = {};

    for ( let i = 0; i < inputs.length; i++ ) {
      if ( inputs[i].value ) {
        data[getField( inputs[i] )] = inputs[i].value;
      }
    }

    if ( !Object.keys( data ).length ) { return }

    const queryData = {
      collName: collName,
      data: data,
    };

    TypesenseAPI.setDoc( queryData )
      .then( res => {
        if ( res.httpStatus == 400 ) {
          setMessage( collName, 'ERROR: ' + String( res ).split( 'Server said:' )[1] );
        }
        else if ( res.httpStatus == 409 ) {
          setMessage( collName, 'ERROR: ' + String( res ).split( 'Server said:' )[1] );
        }
        else if ( !res.httpStatus ) {
          CollState[collName].foundTotal += 1;
          TypesenseAPI.draw( {
            collName: collName,
            q: '*',
            pageNumber: 1,
          } ).then( () => {
            setMessage( collName, 'NEW DOC ADDED' );
          } );
        }
      } );
  }

  function handleDeleteDoc( e ) {
    V.setToggle( '.btn__confirm-' + e.target.getAttribute( 'row' ) );
  }

  function handleConfirmDelete( e ) {

    const queryData = {
      collName: getCollName( e.target ),
      which: getDoc( e.target ),
    };

    TypesenseAPI.deleteDoc( queryData )
      .then( res => {
        if ( res.httpStatus != 404 ) {
          setMessage( queryData.collName, 'DOC DELETED' );
          setDeleted( queryData.which );
          setTimeout( function clearDelay() {
            clearButtons();
          }, 850 );
        }
      } );
  }

  function handleSearchMouseover( e ) {
    if ( hasFocus() ) { return }
    clearSearchHighlights();
    setButtons( e );
    setHighlight( e );
  }

  function handleSearchFocus( e ) {
    setTimeout( function searchFocusDelay() {
      clearSearchHighlights();
      setButtons( e );
      setHighlight( e );
      setPlaceholder( e );
    }, 20 );
  }

  function handleSearchBlur( e ) {
    setTimeout( function searchBlurDelay() {
      clearSearchHighlights();
      clearPlaceholder( e );
    }, 20 );
  }

  function handleRowMouseover( e ) {
    if ( hasFocus() ) { return }
    clearSearchHighlights();
    if ( e.target.closest( 'cell' ).classList.contains( 'deleted' ) ) {
      // TODO:
      // setRestoreButton( e );
    }
    else {
      setDeleteButtons( e );
    }
  }

  function handleCellMouseover( e ) {
    if ( hasFocus() ) { return }
    clearSearchHighlights();
    const collName = getCollName( e.target );
    setMessage( collName, e.target.innerText );
    if ( this == 'id' ) { return }
    setCellHighlight( e );
  }

  function handleCellMouseout( e ) {
    if ( hasFocus() ) { return }
    clearCellHighlight( e );
  }

  function handleCellFocus( e ) {
    cellContentBefore = e.target.innerText;
    clearDetailView();
    setCellHighlight( e );
  }

  function handleCellBlur( e ) {
    clearCellHighlight( e );
    if ( cellContentBefore != e.target.innerText ) {
      const queryData = {
        collName: getCollName( e.target ),
        which: getDoc( e.target ),
        data: {},
      };
      queryData.data[getField( e.target )] = e.target.innerText;

      TypesenseAPI.updateDoc( queryData )
        .then( res => {
          if ( res.httpStatus != 404 ) {
            setMessage( queryData.collName, 'UPDATED' );
          }
        } );
    }
  }

  function handleCellScroll( e ) {
    e.target.closest( '.collection' ).children[1].scrollLeft += 10;
  }

  function handleHeaderMouseover( e ) {
    if (
      V.getVisibility( '.btn__up' )
    ) { return }

    clearSearchHighlights();
    setPagesButtons( e );

  }

  /** UI Interactions */

  function setDeleted( which ) {
    V.getNodes( '[doc="' + which + '"]' ).forEach( $cell => {
      if ( $cell.tagName == 'SPAN' ) { return }
      $cell.classList.remove( 'shade1', 'shade2' );
      $cell.classList.add( 'deleted' );
    } );
  }

  function setHighlight( e ) {
    e.target.closest( '.cell-inner' ).classList.add( 'highlight-border' );
  }

  function clearHighlight() {
    V.getNodes( '.cell-inner' ).forEach( $elem => {
      $elem.classList.remove( 'highlight-border' );
    } );
  }

  function setCellHighlight( e ) {
    e.target.closest( '.cell-inner' ).classList.add( 'cell-highlight' );
  }

  function clearCellHighlight( e ) {
    e.target.closest( '.cell-inner' ).classList.remove( 'cell-highlight' );
  }

  function setPlaceholder( e ) {
    e.target.classList.add( 'search-input-sel' );
  }

  function clearPlaceholder( e ) {
    e.target.classList.remove( 'search-input-sel' );
  }

  function setButtons( e ) {
    e.target.parentNode.append( btnWrapper() );
  }

  function setDeleteButtons( e ) {
    if ( V.getVisibility( '.btn-wrapper' ) ) { return }
    e.target.parentNode.append( btnWrapperDelete( getRow( e.target ) ) );
  }

  function setRestoreButton( e ) {
    if ( V.getVisibility( '.btn-wrapper' ) ) { return }
    e.target.parentNode.append( btnWrapperRestore( e.target.innerText ) );
  }

  function setPagesButtons( e ) {
    V.getNode( '#coll-title-of__' + getCollName( e.target ) ).append( btnWrapperPages() );
  }

  function clearButtons() {
    V.getNodes( '.btn-wrapper' ).forEach( $elem => {
      V.sN( $elem, 'clear' );
    } );
  }

  function clearDetailView() {
    V.getNodes( '.viewer' ).forEach( $elem => {
      $elem.innerText = '';
    } );
  }

  function clearSearchHighlights() {
    clearButtons();
    clearHighlight();
    clearDetailView();
  }

  function getCollName( $elem ) {
    return $elem.closest( '.collection' ).getAttribute( 'collname' );
  }

  function getDoc( $elem ) {
    return $elem.closest( 'cell' ).getAttribute( 'doc' );
  }

  function getField( $elem ) {
    return $elem.closest( 'cell' ).getAttribute( 'field' );
  }

  function getRow( $elem ) {
    return $elem.closest( 'cell' ).getAttribute( 'row' );
  }

  function getInputs( $elem ) {
    return $elem
      .closest( '.collection' )
      .querySelector( '.table' )
      .querySelectorAll( 'input' );
  }

  function setMessage( collName, msg ) {
    V.getNode( '#viewer-of__' + collName ).innerText = msg;
  }

  function hasFocus() {
    return document.activeElement.tagName == 'INPUT'
    || document.activeElement.tagName == 'SPAN';
  }

  /** Search Components */

  function searchTable( coll ) {
    const cellWidthPercent = 100 / ( coll.fields.length + 1 );
    return V.cN( {
      c: 'table-wrapper search-table',
      h: {
        c: 'table flex relative',
        h: ( ( coll ) => {

          let cells = [{
            field: 'row',
          }];

          coll.fields.forEach( field => {
            cells.push( {
              field: field.name,
            } );
          } );

          cells = cells.map( cell => ( {
            t: 'cell',
            c: 'border border-box shade2',
            a: {
              field: cell.field,
            },
            y: {
              width: cellWidthPercent + '%',
            },
            h: searchTableInput( cell, cellWidthPercent ),
          } ) );
          return cells;
        } )( coll ),
      },
    } );
  }

  function searchTableInput( cell, cellWidthPercent ) {
    const inputWidthPixel = Math.floor( window.innerWidth * cellWidthPercent / 100 ) - 20;

    return V.cN( {
      x: cell.field == 'row' ? false : true,
      c: 'cell-inner cell-inner__search',
      h: {
        c: 'search',
        h: {
          t: 'input',
          c: 'search-input',
          y: {
            width: inputWidthPixel + 'px',
          },
          a: {
            placeholder: cell.field,
          },
          e: {
            focus: handleSearchFocus,
            blur: handleSearchBlur,
            mouseover: handleSearchMouseover,
          },
        },
      },
    } );
  }

  /** Hits Components */

  function hitsTableWrapper( coll ) {
    return V.cN( {
      c: 'table-wrapper hits-table',
      i: 'hits-table-of__' + coll.name,
      h: {
        c: 'table flex relative',
        h: ( ( coll ) => {
          let cells = [''];

          coll.fields.forEach( () => {
            cells.push( '' );
          } );

          /** cast placeholder cells */
          cells = cells.map( () => ( {
            t: 'cell',
            c: 'cell-padding border border-box shade1',
            y: {
              width: 100 / ( coll.fields.length + 1 ) + '%',
            },
            h: '..',
          } ) );
          return cells;
        } )( coll ),
      },
    } );
  }

  function hitsTable( hits ) {
    return V.cN( {
      c: 'table flex relative',
      h: ( ( hits ) => {
        let cells = [];

        /** cast cell data */
        hits.data.forEach( ( hit, i ) => {
          cells.push( {
            row: i + 1,
            col: 1,
            rng: hits.rangeEnd - i,
            field: 'row',
            doc: hit.id,
            fill: hits.rangeEnd - i, // displays hits row number
            // fill: i + 1, // displays table row number
          } );
          hits.fields.forEach( ( field, j ) => {
            cells.push( {
              row: i + 1,
              col: j + 2,
              rng: hits.rangeEnd - i,
              field: field.name,
              doc: hit.id,
              fill: hit[field.name],
            } );
          } );
        } );

        /** cast cell nodes */
        cells = cells.map( item => ( {
          t: 'cell',
          c: 'border border-box'
              + ( item.col == 1 ? ' shade2 relative' : ' shade1' ),
          y: {
            width: 100 / ( hits.fields.length + 1 ) + '%',
          },
          a: {
            row: item.row,
            col: item.col,
            rng: item.rng,
            field: item.field,
            doc: item.doc,
          },
          h: {
            c: 'cell-inner cell-padding',
            h: {
              t: 'span',
              c: 'full-span',
              a: {
                contenteditable: item.col > 2 ? 'true' : undefined,
              },
              h: item.fill,
              e: {
                scroll: item.col > 1 ? handleCellScroll : undefined,
                mouseover: item.col == 1
                  ? handleRowMouseover
                  : item.col == 2
                    ? handleCellMouseover.bind( 'id' )
                    : handleCellMouseover.bind( 'content' ),
                mouseout: item.col > 2 ? handleCellMouseout : undefined,
                focus: item.col > 2 ? handleCellFocus : undefined,
                blur: item.col > 2 ? handleCellBlur : undefined,
              },
            },
          },
        } ) );
        return cells;
      } )( hits ),
    } );
  }

  /** Buttons */

  function btnWrapper() {
    return V.cN( {
      c: 'btn-wrapper btn-wrapper__search flex absolute',
      h: [
        searchBtn(),
        uploadBtn(),
        closeBtn(),
      ],
    } );
  }

  function btnWrapperDelete( row ) {
    return V.cN( {
      c: 'btn-wrapper btn-wrapper__delete flex absolute',
      h: [
        deleteBtn( row ),
        confirmBtn( row ),
      ],
    } );
  }

  function btnWrapperRestore( row ) {
    return V.cN( {
      c: 'btn-wrapper btn-wrapper__restore flex absolute',
      h: [
        restoreBtn( row ),
      ],
    } );
  }

  function btnWrapperPages() {
    return V.cN( {
      c: 'btn-wrapper btn-wrapper__pages flex',
      h: [
        pageUpBtn(),
        pageDownBtn(),
      ],
    } );
  }

  function searchBtn() {
    return V.cN( {
      c: 'btn btn__search',
      h: castIcon( 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' ),
      k: handleQuery,
    } );
  }

  function closeBtn() {
    return V.cN( {
      c: 'btn btn__close',
      h: castIcon( 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' ),
      k: handleQueryReset,
    } );
  }

  function deleteBtn( row ) {
    return V.cN( {
      c: 'btn btn__delete btn__delete-' + row,
      a: {
        row: row,
      },
      h: castIcon( 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z', row ),
      k: handleDeleteDoc,
    } );
  }

  function confirmBtn( row ) {
    return V.cN( {
      c: 'btn hidden btn__confirm btn__confirm-' + row,
      a: {
        row: row,
      },
      h: castIcon( 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z', row ),
      k: handleConfirmDelete,
    } );
  }

  function uploadBtn() {
    return V.cN( {
      c: 'btn btn__upload',
      h: castIcon( 'M5,20h14v-2H5V20z M5,10h4v6h6v-6h4l-7-7L5,10z' ),
      k: handleSetDoc,
    } );
  }

  function pageUpBtn() {
    return V.cN( {
      c: 'btn btn__up',
      h: castIcon( 'M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z' ),
      k: handleQueryPages.bind( 'up' ),
    } );
  }

  function pageDownBtn() {
    return V.cN( {
      c: 'btn btn__down',
      h: castIcon( 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z' ),
      k: handleQueryPages.bind( 'down' ),
    } );
  }

  function restoreBtn( row ) {
    return V.cN( {
      c: 'btn btn__upload',
      a: {
        row: row,
      },
      h: castIcon( 'M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z', row ),
      k: handleSetDoc,
    } );
  }

  function castIcon( path, row ) {
    return V.cN( {
      svg: true,
      a: {
        row: row,
        viewBox: '0 0 24 24',
        height: '100%',
        fill: '#FFFFFF',
      },
      h: {
        svg: true,
        t: 'path',
        a: {
          row: row,
          d: path,
        },
      },
    } );
  }

  /** Other Components */

  function collHeader( coll ) {
    const $collHeader = V.cN( {
      c: 'collection__header border border-box',
      e: {
        mouseover: handleHeaderMouseover,
      },
      h: [
        {
          c: 'collection__title flex items-center',
          i: 'coll-title-of__' + coll.name,
          h: {
            t: 'h2',
            h: 'Collection ' + coll.name.toUpperCase(),
          },
        },
        {
          c: 'collection__info flex items-center',
          h: [
            {
              t: 'h3',
              h: [
                {
                  t: 'span',
                  c: 'hits-detail hits-detail__found',
                  h: 'Found',
                },
                {
                  t: 'span',
                  c: 'hits-detail hits-detail__number',
                  i: 'found__' + coll.name,
                  h: '0',
                },
                // {
                //   t: 'span',
                //   c: 'hits-detail hits-detail__found-total',
                //   h: 'Total',
                // },
                // {
                //   t: 'span',
                //   c: 'hits-detail hits-detail__number '
                //  + coll.name + '-found-total',
                //   h: '0',
                // },
                {
                  t: 'span',
                  c: 'hits-detail hits-detail__range',
                  h: 'Range',
                },
                {
                  t: 'span',
                  c: 'hits-detail hits-detail__number',
                  i: 'page-range__' + coll.name,
                  h: '0 - 0',
                },
                {
                  t: 'span',
                  c: 'hits-detail hits-detail__page',
                  h: 'Page',
                },
                {
                  t: 'span',
                  c: 'hits-detail hits-detail__number',
                  i: 'page-number__' + coll.name,
                  h: '0',
                },
              ],
            },
          ],
        },

      ],
    } );
    // $collHeader.addEventListener( 'mouseover', handleHeaderMouseover, { once: true } );
    return $collHeader;
  }

  function detailView( coll ) {
    return V.cN( {
      c: 'viewer',
      i: 'viewer-of__' + coll.name,
      h: '',
    } );
  }

  return {
    searchTable: searchTable,
    hitsTable: hitsTable,
    hitsTableWrapper: hitsTableWrapper,
    collHeader: collHeader,
    detailView: detailView,
  };
} )();
