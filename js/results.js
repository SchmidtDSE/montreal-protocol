import { FilterSet } from "./report_data";

class ScorecardPresenter {

  constructor(targetId) {
    const self = this;
    self._root = document.getElementById(targetId);
  }

  showResults(results, currentYear) {
    const self = this;
    
    const emissionsScorecard = self._root.querySelector(".emissions-scorecard");
    const salesScorecard = self._root.querySelector(".sales-scorecard");
    const equipmentScorecard = self._root.querySelector(".equipment-scorecard");

    const filterSet = self._buildFilterSet();
    const emissionsValue = results.getEmissions();
    const salesValue = results.getSales();
    const equipmentValue = results.getPopulation();

    self._updateCard(emissionsScorecard, emissionsValue, currentYear);
    self._updateCard(salesScorecard, salesValue, currentYear);
    self._updateCard(equipmentScorecard, equipmentValue, currentYear);
  }

  _updateCard(scorecard, value, currentYear) {
    const self = this;
    self._setText(scorecard.querySelector(".value"), value);
    self._setText(scorecard.querySelector(".current-year"), currentYear);
  }

  _setText(selection, value) {
    selection.innerHTML = "";
    const newTextNode = document.createTextNode(value);
    selection.appendChild(newTextNode);
  }

  _buildFilterSet() {
    const self = this;
    return new FilterSet(null, null, null, null);
  }

}


class ResultsPresenter {
  constructor(targetId) {
    const self = this;
    self._root = document.getElementById(targetId);
    self.hide();
  }

  hide() {
    const self = this;
    self._root.style.display = "none";
  }

  showResults(results) {
    const self = this;
    self._root.style.display = "block";
  }
}


export {ResultsPresenter};
