import loadable from "@loadable/component"
import { graphql } from "react-relay"
import { RouteConfig } from "found"

const BuyerGuaranteeApp = loadable(() => import("./BuyerGuaranteeApp"), {
  resolveComponent: component => component.BuyerGuaranteeApp,
})

const BuyerGuaranteeIndexRoute = loadable(
  () => import("./Routes/BuyerGuaranteeIndex"),
  {
    resolveComponent: component =>
      component.BuyerGuaranteeIndexFragmentContainer,
  }
)

export const buyerGuaranteeRoutes: RouteConfig[] = [
  {
    path: "/buyer-guarantee",
    getComponent: () => BuyerGuaranteeApp,
    prepare: () => {
      BuyerGuaranteeApp.preload()
    },
    children: [
      {
        path: "",
        getComponent: () => BuyerGuaranteeIndexRoute,
        prepare: () => {
          return BuyerGuaranteeIndexRoute.preload()
        },
        query: graphql`
          query buyerGuaranteeRoutes_BuyerGuaranteeQuery {
            buyerGuarantee: me {
              ...BuyerGuaranteeIndex_buyerGuarantee
            }
          }
        `,
      },
    ],
  },
]
