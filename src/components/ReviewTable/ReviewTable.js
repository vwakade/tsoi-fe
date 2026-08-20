import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';

import css from './ReviewTable.module.css';

/**
 * A horizontally scrollable data table for admin queues and dashboard summaries.
 *
 * Scrolls inside its own container on narrow viewports rather than squashing columns.
 * Always renders an empty state — the approval queues hit it constantly once the
 * pending backlog is cleared.
 *
 * @component
 * @param {Object} props
 * @param {Array<{key: string, labelId: string, align?: 'right'}>} props.columns column defs
 * @param {Array<{id: string, cells: Object}>} props.rows one entry per row; `cells` is
 *   keyed by column key and holds a ReactNode
 * @param {string} [props.emptyMessageId] translation id for the empty state
 * @param {string} [props.className] extends the root class
 * @param {number} [props.minWidth] min table width in px before scrolling kicks in
 * @returns {JSX.Element}
 */
const ReviewTable = props => {
  const {
    columns = [],
    rows = [],
    emptyMessageId = 'ReviewTable.empty',
    className,
    minWidth = 720,
  } = props;

  return (
    <div className={classNames(css.root, className)}>
      <table className={css.table} style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={classNames(css.headCell, { [css.alignRight]: col.align === 'right' })}
              >
                <FormattedMessage id={col.labelId} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className={css.emptyCell} colSpan={columns.length}>
                <FormattedMessage id={emptyMessageId} />
              </td>
            </tr>
          ) : (
            rows.map(row => (
              <tr key={row.id} className={css.row}>
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={classNames(css.cell, {
                      [css.alignRight]: col.align === 'right',
                    })}
                  >
                    {row.cells[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReviewTable;
