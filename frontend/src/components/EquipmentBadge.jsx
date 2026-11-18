import PropTypes from "prop-types";
import { equipmentInfo } from "../constants/equipment.js";
import "./EquipmentBadge.css";

export default function EquipmentBadge({ value }) {
  const { icon, label } = equipmentInfo(value);
  return (
    <span className="equipment-badge">
      <span aria-hidden="true">{icon}</span> {label}
    </span>
  );
}

EquipmentBadge.propTypes = {
  value: PropTypes.string.isRequired,
};
