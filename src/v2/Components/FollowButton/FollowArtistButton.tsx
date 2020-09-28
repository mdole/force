import {
  FollowedArgs,
  Intent,
  followedArtist,
  unfollowedArtist,
} from "@artsy/cohesion"
import { Box } from "@artsy/palette"
import { FollowArtistButtonMutation } from "v2/__generated__/FollowArtistButtonMutation.graphql"
import * as Artsy from "v2/Artsy"
import { FollowArtistPopoverFragmentContainer as SuggestionsPopover } from "v2/Components/FollowArtistPopover"
import React from "react"
import track, { TrackingProp } from "react-tracking"
import styled from "styled-components"
import { FollowArtistButton_artist } from "../../__generated__/FollowArtistButton_artist.graphql"
import { FollowButton } from "./Button"
import { FollowTrackingData } from "./Typings"
import {
  RelayProp,
  commitMutation,
  createFragmentContainer,
  graphql,
} from "react-relay"
import { openAuthToFollowSave } from "v2/Utils/openAuthModal"
import { Mediator } from "v2/Artsy"
import {
  AnalyticsContextProps,
  withAnalyticsContext,
} from "v2/Artsy/Analytics/AnalyticsContext"

interface Props
  extends React.HTMLProps<FollowArtistButton>,
    Artsy.SystemContextProps,
    AnalyticsContextProps {
  relay?: RelayProp
  mediator?: Mediator
  artist?: FollowArtistButton_artist
  tracking?: TrackingProp
  trackingData: FollowTrackingData
  /**
   * Custom renderer for alternative button displays
   */
  render?: (artist: FollowArtistButton_artist) => JSX.Element
  triggerSuggestions?: boolean
}

interface State {
  openSuggestions: boolean
}

const SuggestionsPopoverContainer = styled(Box)`
  position: absolute;
  z-index: 1;
`

const Container = styled.span`
  display: inline-block;
`

@track()
export class FollowArtistButton extends React.Component<Props, State> {
  static defaultProps = {
    triggerSuggestions: false,
  }

  state = { openSuggestions: false }

  trackFollow = () => {
    const {
      tracking,
      artist,
      trackingData,
      contextPageOwnerId,
      contextPageOwnerSlug,
      contextPageOwnerType,
    } = this.props

    // FIXME: remove contextOwner from trackingData when apps use AnalyticsContext
    const args: FollowedArgs = {
      ownerId: artist.internalID,
      ownerSlug: artist.slug,
      contextModule: trackingData.contextModule,
      contextOwnerId: contextPageOwnerId || trackingData.contextOwnerId,
      contextOwnerSlug: contextPageOwnerSlug || trackingData.contextOwnerSlug,
      contextOwnerType: contextPageOwnerType || trackingData.contextOwnerType,
    }

    const analyticsData = artist.is_followed
      ? unfollowedArtist(args)
      : followedArtist(args)

    tracking.trackEvent(analyticsData)
  }

  handleFollow = e => {
    e.preventDefault() // If this button is part of a link, we _probably_ dont want to actually follow the link.
    const { artist, user, mediator, trackingData } = this.props

    if (user && user.id) {
      this.followArtistForUser()
    } else {
      openAuthToFollowSave(mediator, {
        entity: artist,
        contextModule: trackingData.contextModule,
        intent: Intent.followArtist,
      })
    }
  }

  followArtistForUser = () => {
    const { artist, relay, triggerSuggestions } = this.props

    const newFollowCount = artist.is_followed
      ? artist.counts.follows - 1
      : artist.counts.follows + 1

    commitMutation<FollowArtistButtonMutation>(relay.environment, {
      mutation: graphql`
        mutation FollowArtistButtonMutation($input: FollowArtistInput!) {
          followArtist(input: $input) {
            artist {
              id
              slug
              is_followed: isFollowed
              counts {
                follows
              }
            }
          }
        }
      `,
      variables: {
        input: {
          artistID: artist.internalID,
          unfollow: artist.is_followed,
        },
      },
      optimisticResponse: {
        followArtist: {
          artist: {
            id: artist.id,
            slug: artist.slug,
            is_followed: !artist.is_followed,
            counts: { follows: newFollowCount },
          },
        },
      },
      updater: (store, data) => {
        const artistProxy = store.get(data.followArtist.artist.id)

        artistProxy
          .getLinkedRecord("counts")
          .setValue(newFollowCount, "follows")
      },
    })
    this.trackFollow()
    if (triggerSuggestions && !artist.is_followed) {
      this.setState({ openSuggestions: true })
    }
  }

  closePopover() {
    this.setState({ openSuggestions: false })
  }

  render() {
    const { artist, render, user } = this.props
    const { openSuggestions } = this.state

    // Custom button renderer
    const content = render ? (
      <Container
        tabIndex={0}
        role="button"
        onKeyPress={event => {
          if (event.key === "Enter" || event.key === " ") {
            this.handleFollow(event)
          }
        }}
        onClick={this.handleFollow}
      >
        {" "}
        {render(artist)}
      </Container>
    ) : (
      <FollowButton
        isFollowed={artist && artist.is_followed}
        handleFollow={this.handleFollow}
      />
    )

    return (
      <>
        {content}
        {openSuggestions && (
          <SuggestionsPopoverContainer>
            <SuggestionsPopover
              user={user}
              artist={artist}
              onClose={() => this.closePopover()}
            />
          </SuggestionsPopoverContainer>
        )}
      </>
    )
  }
}

export const FollowArtistButtonFragmentContainer = createFragmentContainer(
  Artsy.withSystemContext(
    withAnalyticsContext(FollowArtistButton)
  ) as React.ComponentType<Props>,
  {
    artist: graphql`
      fragment FollowArtistButton_artist on Artist
        @argumentDefinitions(
          showFollowSuggestions: { type: "Boolean", defaultValue: false }
        ) {
        id
        internalID
        name
        slug
        is_followed: isFollowed
        counts {
          follows
        }
        ...FollowArtistPopover_artist @include(if: $showFollowSuggestions)
      }
    `,
  }
)
