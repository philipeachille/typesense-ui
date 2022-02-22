
const V = ( function() { // eslint-disable-line no-unused-vars

  /**
   * V Core Module for DOM-manipulation
   *
   * Adjusted from VCore v3.4.0
   * @ https://github.com/valueinstrument/v-alpha
   *
   */

  'use strict';

  /* ================== private methods ================= */

  function placeNode( $targetNode, $node, prepend ) {
    prepend == 'prepend' || prepend == true ? $targetNode.prepend( $node ) : $targetNode.append( $node );
  }

  function setAttr( $elem, attr, data ) {
    if ( data === undefined ) { return }
    if ( String( data ) ) {
      $elem.setAttribute( attr, String( data ) );
    }
  }

  function writeStyle( data, $customStyles ) {

    let string = '';

    for( const className in data ) {
      const formattedClassName = ( className => {
        // TODO: @media
        if ( className.includes( '@font-face' ) ) {
          return '@font-face' + '{';
        }
        else {
          return '.' + className + '{';
        }
      } )( className );

      if ( $customStyles.textContent.includes( formattedClassName ) ) {
        // TODO: should not just skip, but update
        continue;
      }
      else {
        string += formattedClassName;
        for( const prop in data[className] ) {
          string += prop + ':' + data[className][prop] + ';';
        }
        string += '}';
      }
    }
    return string;
  }

  /* ================== public methods ================== */

  function castNode( data ) {

    if ( [data.x, data.condition].includes( false ) ) {
      return '';
    }

    let $elem, tag;

    if ( data.svg ) {
      tag = data.t || data.tag || 'svg';
      $elem = document.createElementNS( 'http://www.w3.org/2000/svg', tag );
    }
    else {
      tag = data.t || data.tag || 'div';
      $elem = document.createElement( tag );
    }

    if ( tag == 'svg' ) {
      setAttr( $elem, 'xmlns', 'http://www.w3.org/2000/svg' );
      setAttr( $elem, 'version', '1.1' );
    }

    for ( const key in data ) {
      if ( ['c', 'class', 'classes'].includes( key ) ) {
        if ( data[key] ) {
          setAttr( $elem, 'class', data[key] );
        }
        continue;
      }
      else if ( ['h', 'html'].includes( key ) ) {
        if ( data[key] && ['string', 'number'].includes( typeof data[key] ) ) {
          $elem.appendChild( document.createTextNode( data[key] ) );
        }
        else if ( Array.isArray( data[key] ) ) {
          for ( let i = 0; i < data[key].length; i++ ) {
            if ( [data[key][i].x, data[key][i].condition].includes( false ) ) {
              continue;
            }
            if ( !data[key][i].localName ) {
              data[key][i] = castNode( data[key][i] );
            }
            $elem.appendChild( data[key][i] );
          }
        }
        else if ( data[key] ) {
          if ( !data[key].localName ) {
            data[key] = castNode( data[key] );
          }
          $elem.appendChild( data[key] );
        }
        continue;
      }
      else if ( ['a', 'attribute', 'attributes'].includes( key ) ) {
        for ( const attr in data[key] ) {
          setAttr( $elem, attr, data[key][attr] );
        }
        continue;
      }
      else if ( ['s', 'setStyle', 'setStyles', 'setClass', 'setClasses'].includes( key ) ) {
        if ( data[key] ) {
          setStyle( data[key] );
        }
        continue;
      }
      else if ( ['k', 'click'].includes( key ) ) {
        if ( data[key] ) {
          $elem.addEventListener( 'click', data[key] );
        }
        continue;
      }
      else if ( ['e', 'event', 'events'].includes( key ) ) {
        for ( const evt in data[key] ) {
          if ( data[key][evt] ) {
            $elem.addEventListener( evt, data[key][evt] );
          }
        }
        continue;
      }
      else if ( ['y', 'style', 'styles'].includes( key ) ) {
        if ( data[key] ) {
          Object.assign( $elem.style, data[key] );
        }
        continue;
      }
      else if ( ['i', 'id'].includes( key ) ) {
        setAttr( $elem, 'id', data[key] );
        continue;
      }
      else if ( ['f', 'href'].includes( key ) ) {
        setAttr( $elem, 'href', data[key] );
        continue;
      }
      else if ( ['r', 'src'].includes( key ) ) {
        setAttr( $elem, 'src', data[key] );
        continue;
      }
      else if ( ['v', 'value'].includes( key ) ) {
        setAttr( $elem, 'value', data[key] );
        continue;
      }
      else if ( ['innerHtml'].includes( key ) ) {
        $elem.innerHTML = data[key];
      }
    }
    return $elem;
  }

  function cN( data ) {
    return castNode( data );
  }

  function setNode( targetNode, data, prepend ) {

    /**
     * Create a HTML element and optionally place it into target node
     * @param { (string|Object) } targetNode - The target node to fetch, target node object or settings object
     * @param { (Object|Array) } data - The settings object, node object or array of node objects
     *
     * Examples of allowed combinations:

       setNode( { tag: 'div', classes: 'large blue', ... } ); // "tag or "t"

       setNode( '.body-wrapper', { tag: 'div', classes: 'large blue', ... } ); // "tag or "t"

       setNode( $targetNode, $someNode );

       setNode( $targetNode, [ $someNode, $someOtherNode, ... ] );

     */

    /**
     * clear node or clear inner content of node
     */

    if ( data && ( data == 'clear' || data.clear == true ) ) {
      const $elem = typeof targetNode != 'string' ? targetNode : document.querySelector( targetNode );
      $elem ? $elem.parentNode.removeChild( $elem ) : null;
      return;
    }

    if ( ['string', 'number'].includes( typeof data ) ) {
      const $elem = typeof targetNode != 'string' ? targetNode : document.querySelector( targetNode );
      $elem ? $elem.textContent = String( data ) : null;
      return;
    }

    /**
     * determine actions based on targetNode and data
     */

    if ( data ) {

      let $targetNode = targetNode;

      if ( typeof targetNode == 'string' ) {

        /**
         * 1. fetch node from DOM
         * 2. replace targetNode with the fetched node
         */

        $targetNode = getNode( targetNode );
      }

      if ( Array.isArray( data ) ) {
        data.forEach( item => {
          if ( item instanceof Element ) {

            /**
            * place given node into target node
            */

            placeNode( $targetNode, item, prepend );
          }
          else {

            /**
            * 1. create new node
            * 2. place this new node into target node
            */

            placeNode( $targetNode, castNode( item ), prepend );

          }

          // placeNode( $targetNode, item, prepend );

        } );
      }
      else if ( typeof data == 'object' ) {
        if ( data instanceof Element ) {

          /**
          * place given node into target node
          */

          placeNode( $targetNode, data, prepend );
        }
        else {

          /**
          * 1. create new node
          * 2. place this new node into target node
          */

          placeNode( $targetNode, castNode( data ), prepend );

        }
      }
    }
    else if ( targetNode.t || targetNode.tag ) {

      /**
       * not a target node in this case
       * create and return a new in-memory node instead
       */

      return castNode( targetNode );

    }
    else {
      throw new Error( 'Can not set node' );
    }

  }

  function sN( targetNode, data ) {
    return setNode( targetNode, data );
  }

  function getNode( which ) {
    const $node = document.querySelector( which );
    if ( $node ) {
      Object.assign( $node, {
        getNode: getNode,
        getNodes: getNodes,
      } );

      return $node;
    }
  }

  function getNodes( which ) {
    const nodes = document.querySelectorAll( which );
    if ( nodes ) {
      nodes.forEach( $node => {
        Object.assign( $node, {
          getNode: getNode,
          getNodes: getNodes,
        } );
      } );

      return nodes;
    }
  }

  function gN( which ) {
    return getNode( which );
  }

  function setAnimation( targetNode, css, options ) {

    /**
     * Dependency: velocity.js 1.5.2
     *
     * velocity 1.5.2 is in use
     *  - v2.x caused errors
     *  - does not animate scroll, therefore getNode( ... ).scrollLeft = 0 is being
     *    used in navigation-animations
     */

    let $targetNode = targetNode;

    if ( typeof targetNode == 'string' ) {
      $targetNode = getNode( targetNode );
    }

    const animationSpeed = 250;

    options == undefined ? options = {} : options;
    options.delay == undefined ? 0 : options.delay = options.delay * animationSpeed;
    options.duration == undefined ? 0 : options.duration = options.duration * animationSpeed;

    return Velocity( $targetNode, css, options );

  }

  function sA( targetNode, css, options ) {
    return setAnimation( targetNode, css, options );
  }

  function setStyle( whichId, data ) {

    if ( typeof whichId == 'object' ) {
      data = whichId;
      whichId = 'component-styles';
    }
    if ( !document.getElementById( whichId ) ) {
      setNode( 'head', {
        t: 'style',
        i: whichId,
      } );
    }
    const $customStyles = document.getElementById( whichId );

    if ( typeof data == 'string' ) {
      if ( !$customStyles.textContent.includes( data ) ) {
        // TODO: should not just skip, but update
        $customStyles.textContent += data;
      }
    }
    else if ( typeof data == 'object' ) {
      $customStyles.textContent += writeStyle( data, $customStyles );
    }
  }

  function getCss( which ) {
    const cssVar = getComputedStyle( document.documentElement ).getPropertyValue( which ).replace( 'px', '' ).replace( 'rem', '' );
    if ( isNaN( cssVar ) ) {
      return cssVar.trim();
    }
    else {
      return Number( cssVar );
    }
  }

  function getVisibility( which ) {
    // ;) from https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js
    const $elem = typeof which == 'string' ? getNode( which ) : which;
    if ( $elem ) {
      return !!( $elem.offsetWidth || $elem.offsetHeight || $elem.getClientRects().length );
    }
    else {
      return undefined;
    }
  }

  function castRemToPixel( remValue ) {
    return Number( remValue ) * parseFloat( getComputedStyle( document.documentElement ).fontSize );
  }

  function setScript( src, id ) {
    // console.log( src );
    return new Promise( function( resolve, reject ) {
      const s = document.createElement( 'script' );
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      id ? s.id = id : null;
      document.head.appendChild( s );
    } );
  }

  function setStylesheet( src ) {
    return new Promise( function( resolve, reject ) {
      const l = document.createElement( 'link' );
      l.type = 'text/css';
      l.rel = 'stylesheet';
      l.href = src;
      l.onload = resolve;
      l.onerror = reject;
      document.head.appendChild( l );
    } );
  }

  function setToggle( element ) {
    typeof element == 'string' ? element = getNode( element ) : null;
    if ( getVisibility( element ) ) {
      element.style.display = 'none';
    }
    else {
      element.style.display = 'block';
    }
  }

  /* ====================== export ====================== */

  return {
    castNode: castNode,
    cN: cN,
    setNode: setNode,
    sN: sN,
    getNode: getNode,
    gN: gN,
    getNodes: getNodes,
    setAnimation: setAnimation,
    sA: sA,
    setStyle: setStyle,
    getCss: getCss,
    getVisibility: getVisibility,
    castRemToPixel: castRemToPixel,
    setScript: setScript,
    setStylesheet: setStylesheet,
    setToggle: setToggle,
  };

} )();
