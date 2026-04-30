export const moduleActionsId = {
    admin: {
        user: {
            CREATE_USER: 1001001,
            UPDATE_USER: 1001002,
            ENABLE_USER: 1001003,
            DISABLE_USER: 1001004,
            RESET_PASS_USER: 1001005,
            CLOSE_ALL_SESSIONS: 1001006
        },
        roles: {
            CREATE_ROLE: 1002001,
            UPDATE_ROLE: 1002002,
            ENABLE_ROLE: 1002003,
            DISABLE_ROLE: 1002004,
            UPDATE_ROLE_ACTIONS: 1002005,
            UPDATE_ROLE_MENUS: 1002006
        }
    },
    masters: {
        departments:{
            CREATE_DEPARTMENT: 2001001,
            UPDATE_DEPARTMENT: 2001002,
            ENABLE_DEPARTMENT: 2001003,
            DISABLE_DEPARTMENT: 2001004,
        },
        locations: {
          CREATE_COUNTRY: 2002101,
          UPDATE_COUNTRY: 2002102,
          CREATE_STATE: 2002201,
          UPDATE_STATE: 2002202,
          CREATE_CITY: 2002301,
          UPDATE_CITY: 2002302
        },
        industries: {
          CREATE_INDUSTRY: 2003001,
          UPDATE_INDUSTRY: 2003002,
          ENABLE_INDUSTRY: 2003003,
          DISABLE_INDUSTRY: 2003004,
        },
        brands: {
          CREATE_BRAND: 2004001,
          ENABLE_BRAND: 2004002,
          DISABLE_BRAND: 2004003,
          IMPORT_EXCEL_BRAND: 2004004,
          DELETE_SUPPLIER_BRAND: 2004005
        }
    },
    partners: {
      clients: {
        CREATE_CLIENT: 3001001,
        UPDATE_CLIENT: 3001002,
        CHANGE_STATUS_CLIENT: 3001003,
        CHANGE_TARGET_CLIENT_INFO: 3001004
      },
      suppliers: {
        CREATE_SUPPLIER: 3002001,
        UPDATE_SUPPLIER: 3002002,
        CHANGE_STATUS_SUPPLIER: 3002003,
      }
    },
    ip: {
      products: {
        CREATE_IP_PRODUCT: 4001001,
        ENABLE_IP_PRODUCT: 4001002,
        DISABLE_IP_PRODUCT: 4001003,
        UPDATE_IP_PRODUCT: 4001004,
        VIEW_HISTORY_IP_PRODUCT: 4001005,
        REPLACE_IP_PRODUCT: 4001006,
        IMPORT_IP_PRODUCT: 4001007
      },
      quote_requests: {
        CREATE_IP_QUOTE_REQUESTS: 4002001,
        UPDATE_IP_QUOTE_REQUESTS: 4002002,
        VIEW_HISTORY_IP_QUOTE_REQUESTS: 4002003,
        CLONE_IP_QUOTE_REQUESTS: 4002005,
        REJECT_IP_QUOTE_REQUESTS: 4002006,
        EDIT_PAYMENT_TERMS_IP_QUOTE_REQUESTS: 4002008,
      },
      quotations: {
        CREATE_IP_QUOTATION: 4003001,
        UPDATE_IP_QUOTATION: 4003002,
        VIEW_HISTORY_IP_QUOTATION: 4003003,
        CLONE_IP_QUOTATION: 4003004,
        REJECT_IP_QUOTATION: 4003005,
        EDIT_PAYMENT_TERMS_IP_QUOTATION: 4003006,
      }
    }
}
