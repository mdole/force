/* tslint:disable */
/* eslint-disable */

import { ReaderFragment } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type PartnerArtistList_artists = ReadonlyArray<{
    readonly representedBy: boolean | null;
    readonly isDisplayOnPartnerProfile: boolean | null;
    readonly counts: {
        readonly artworks: number | null;
    } | null;
    readonly node: {
        readonly internalID: string;
        readonly " $fragmentRefs": FragmentRefs<"PartnerArtistItem_artist">;
    } | null;
    readonly " $refType": "PartnerArtistList_artists";
}>;
export type PartnerArtistList_artists$data = PartnerArtistList_artists;
export type PartnerArtistList_artists$key = ReadonlyArray<{
    readonly " $data"?: PartnerArtistList_artists$data;
    readonly " $fragmentRefs": FragmentRefs<"PartnerArtistList_artists">;
}>;



const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "PartnerArtistList_artists",
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "representedBy",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "isDisplayOnPartnerProfile",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "PartnerArtistCounts",
      "kind": "LinkedField",
      "name": "counts",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "artworks",
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Artist",
      "kind": "LinkedField",
      "name": "node",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "internalID",
          "storageKey": null
        },
        {
          "args": null,
          "kind": "FragmentSpread",
          "name": "PartnerArtistItem_artist"
        }
      ],
      "storageKey": null
    }
  ],
  "type": "ArtistPartnerEdge"
};
(node as any).hash = 'cefe09b8b7ec6cfff5c5620fb2cc9bc0';
export default node;
