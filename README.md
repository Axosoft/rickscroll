# Rickscroll
A high performance scrolling utility for React.
***
## PropTypes
 - className: **string** *(optional)*
 - guttersConfig: **object** *(optional)*
   - left: **object** *(optional)*
     - className: **string** *(optional)*
     - handleClassName: **string** *(optional)*
     - handleWidth: **number** *(optional)*
     - minWidth: **number** *(optional)*
     - width: **number** *(optional)*
   - right: **object** *(optional)*
     - className: **string** *(optional)*
     - handleClassName: **string** *(optional)*
     - handleWidth: **number** *(optional)*
     - minWidth: **number** *(optional)*
     - width: **number** *(optional)*
 - headerConfig: **object** *(optional)*
   - clickToScroll: **bool** *(optional)* - [default: false]
   - lockHeaders: **bool** *(optional)* - [default: false]
 - horizontalScrollConfig: **object** *(optional)*
   - className: **string** *(optional)*
   - contentWidth: **number**
   - scrollbarHeight: **number** *(optional)* - [default: 15]
 - list \*: **array** of **objects** containing
   - className: **string** *(optional)*
   - contentClassName: **string** *(optional)*
   - contentComponent: **React.Component**
   - gutters: **object** *(optional)*
     - left: **object** *(optional)*
       - className: **string** *(optional)*
       - componentClass: **React.Component**
       - handleClassName: **string** *(optional)*
       - props: **object** *(optional)*
     - right: **object** *(optional)*
       - className: **string** *(optional)*
       - componentClass: **React.Component**
       - handleClassName: **string** *(optional)*
       - props: **object** *(optional)*
   - height: **number**
   - props: **object** *(optional)*
 - lists \*: **array** of **objects** containing
   - headerClassName: **string** *(optional)*
   - headerComponent: **React.Component**
   - headerProps: **object** *(optional)*
   - height: **number**
   - rows: *(see definition of **list** prop type above)*
 - scrollTo: **object** *(optional)*
   - x: **number** *(optional)* - [default: 0]
   - y: **number** *(optional)* - [default: 0]
 - verticalScrollConfig: **object** *(optional)*
   - className: **string** *(optional)*
   - scrollbarWidth: **number** *(optional)* - [default: 15]

\* rickscroll requires only one of list/lists. One must be set and no more than one should be set.
