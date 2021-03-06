import { mount } from "enzyme"
import React from "react"
import {
  ArtworkFilterContextProvider,
  initialArtworkFilterState,
  useArtworkFilterContext,
} from "../ArtworkFilterContext"
import { ArtworkFilterMobileActionSheet } from "../ArtworkFilterMobileActionSheet"
import { ArtworkFilters } from "../ArtworkFilters"
import { flushPromiseQueue } from "v2/DevTools"

describe("ArtworkFilterMobileActionSheet", () => {
  let context
  let spy

  const getWrapper = (props = {}) => {
    return mount(
      <ArtworkFilterContextProvider {...props}>
        <ArtworkFilterMobileActionSheetTest />
      </ArtworkFilterContextProvider>
    )
  }

  const ArtworkFilterMobileActionSheetTest = () => {
    context = useArtworkFilterContext()
    spy = jest.fn()

    return (
      <ArtworkFilterMobileActionSheet onClose={spy}>
        <ArtworkFilters />
      </ArtworkFilterMobileActionSheet>
    )
  }

  it("contains correct UI elements", () => {
    const wrapper = getWrapper()

    expect(wrapper.find("Button").first().text()).toEqual("Cancel")

    expect(wrapper.html()).toContain("Filter")

    expect(wrapper.find("Button").last().text()).toEqual("Apply (0)")
  })

  it("resets staged filters to defaults on `Reset` button click", () => {
    const wrapper = getWrapper({
      filters: {
        ...initialArtworkFilterState,
        page: 20,
      },
    })
    wrapper
      .find("Button")
      .findWhere(c => c.text() === "Clear all")
      .first()
      .simulate("click")

    expect(context.stagedFilters).toEqual({
      ...initialArtworkFilterState,
      reset: true,
    })
  })

  it("calls onClose callback on `Apply` button click", () => {
    const wrapper = getWrapper()
    wrapper.find("Button").last().simulate("click")

    expect(spy).toHaveBeenCalled()
  })

  it("renders children content", () => {
    const wrapper = getWrapper()
    expect(wrapper.find("ArtworkFilters")).toHaveLength(1)
  })

  it("mutates staged filter state instead of 'real' filter state", () => {
    const wrapper = getWrapper()

    // Expand the filters we want to make assertions about
    wrapper.find("WaysToBuyFilter").find("ChevronIcon").simulate("click")
    wrapper.find("SizeFilter").find("ChevronIcon").simulate("click")

    wrapper.find("WaysToBuyFilter").find("Checkbox").first().simulate("click")
    wrapper.find("SizeFilter").find("Checkbox").first().simulate("click")

    expect(context.stagedFilters).toMatchObject({
      acquireable: true,
      sizes: ["SMALL"],
    })
    expect(context.filters).not.toMatchObject({
      acquireable: true,
      sizes: ["SMALL"],
    })
  })

  it("counts the number of changing filters", async () => {
    // Zero state: a medium and a way to buy are *already* selected
    const wrapper = getWrapper({
      filters: { medium: "painting", acquireable: true },
    })

    expect(wrapper.find("ApplyButton").text()).toEqual("Apply (0)")

    // Select another way to buy
    wrapper
      .find("WaysToBuyFilter")
      .find("div")
      .findWhere(label => label.text() === "Make offer")
      .first()
      .simulate("click")
    await flushPromiseQueue()

    expect(wrapper.find("ApplyButton").text()).toEqual("Apply (1)")

    // Expand the collapsed filters we want to make assertions about
    wrapper.find("PriceRangeFilter").find("ChevronIcon").simulate("click")

    // Select a price range
    wrapper
      .find("PriceRangeFilter")
      .find("label")
      .findWhere(label => label.text() === "$10K – $25K")
      .first()
      .simulate("click")
    await flushPromiseQueue()

    expect(wrapper.find("ApplyButton").text()).toEqual("Apply (2)")
  })

  describe("the count on the `Apply` button", () => {
    it("is 1 when 1 medium is selected", async () => {
      const wrapper = getWrapper()

      wrapper
        .find("MediumFilter")
        .find("div")
        .findWhere(label => label.text() === "Painting")
        .first()
        .simulate("click")
      await flushPromiseQueue()

      expect(wrapper.find("ApplyButton").text()).toEqual("Apply (1)")
    })

    it("is 1 when 2 mediums are selected", async () => {
      const wrapper = getWrapper()

      wrapper
        .find("MediumFilter")
        .find("div")
        .findWhere(label => label.text() === "Painting")
        .first()
        .simulate("click")
      await flushPromiseQueue()

      expect(wrapper.find("ApplyButton").text()).toEqual("Apply (1)")

      wrapper
        .find("MediumFilter")
        .find("div")
        .findWhere(label => label.text() === "Photography")
        .first()
        .simulate("click")
      await flushPromiseQueue()

      expect(wrapper.find("ApplyButton").text()).toEqual("Apply (1)")
    })

    it("is 1 when 1 rarity is selected", async () => {
      const wrapper = getWrapper()

      wrapper
        .find("AttributionClassFilter")
        .find("div")
        .findWhere(label => label.text() === "Unique")
        .first()
        .simulate("click")
      await flushPromiseQueue()

      expect(wrapper.find("ApplyButton").text()).toEqual("Apply (1)")
    })

    it("is 1 when 2 rarities are selected", async () => {
      const wrapper = getWrapper()

      wrapper
        .find("AttributionClassFilter")
        .find("div")
        .findWhere(label => label.text() === "Unique")
        .first()
        .simulate("click")
      await flushPromiseQueue()

      expect(wrapper.find("ApplyButton").text()).toEqual("Apply (1)")

      wrapper
        .find("AttributionClassFilter")
        .find("div")
        .findWhere(label => label.text() === "Limited Edition")
        .first()
        .simulate("click")
      await flushPromiseQueue()

      expect(wrapper.find("ApplyButton").text()).toEqual("Apply (1)")
    })

    it("is 1 when 1 color is selected", async () => {
      const wrapper = getWrapper()

      wrapper
        .find("button")
        .findWhere(label => label.text() === "Color")
        .first()
        .simulate("click")
      await flushPromiseQueue()

      wrapper
        .find("ColorFilter")
        .find("Checkbox")
        .findWhere(label => label.text() === "Red")
        .first()
        .simulate("click")
      await flushPromiseQueue()

      expect(wrapper.find("ApplyButton").text()).toEqual("Apply (1)")
    })

    it("is 1 when 2 colors are selected", async () => {
      const wrapper = getWrapper()

      wrapper
        .find("button")
        .findWhere(label => label.text() === "Color")
        .first()
        .simulate("click")
      await flushPromiseQueue()

      wrapper
        .find("ColorFilter")
        .find("Checkbox")
        .findWhere(label => label.text() === "Red")
        .first()
        .simulate("click")
      await flushPromiseQueue()

      expect(wrapper.find("ApplyButton").text()).toEqual("Apply (1)")

      wrapper
        .find("ColorFilter")
        .find("Checkbox")
        .findWhere(label => label.text() === "Black and white")
        .first()
        .simulate("click")
      await flushPromiseQueue()

      expect(wrapper.find("ApplyButton").text()).toEqual("Apply (1)")
    })
  })
})
